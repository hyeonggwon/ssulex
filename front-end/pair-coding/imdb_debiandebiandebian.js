
const https = require("https");
const jsdom = require("jsdom");

const simple_https_get = url => (new Promise((resolve, reject) => {
    let req = https.get(url, res => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", payload => { data += payload; });
        res.on("end", () => { resolve(data); });
    });
    req.on("error", error => { reject(error); });
}));

class imdb {

    constructor() {
        this.cache = {};
    }

    async find_series_id(keyword) {
        let title = keyword.replace(/[^a-zA-Z\d ]/g, "").replace(/[A-Z]/g, ch => ch.toLowerCase()).replace(/ /g, "_");
        let json = JSON.parse(await simple_https_get("https://v2.sg.media-imdb.com/suggestion/" + title[0] + "/" + title + ".json"));
        if (json.d)
            return json.d[0].id;
        else
            throw "No suggestion available.";
    }

    async get_directors(id) {
        let dom = new jsdom.JSDOM(await simple_https_get("https://m.imdb.com/title/" + id + "/fullcredits/director"));
        return Object.values(dom.window.document.querySelectorAll("#fullcredits-content h4")).map(node => node.textContent.trim());
    }

    parse_main_page(m) {
        let dom = new jsdom.JSDOM(m);
        return {
            "type": dom.window.document.querySelector(".infobar").textContent.match(/^([^|]+)/)[1].trim(),
            "title": dom.window.document.querySelector(".media-body h1").textContent.match(/^([^(]+)/)[1].trim(),
            "year": dom.window.document.querySelector(".media-body h1").textContent.match(/^[^(]+\((\d+)[^)]+\)/)[1].trim(),
            "synopsis": dom.window.document.querySelector(".plot-description").textContent.trim(),
            "genres": Object.values(dom.window.document.querySelectorAll(".media-body span[itemprop=genre]")).map(node => node.textContent.trim()),
            "thumb_url": dom.window.document.querySelector("img[alt$=Poster]").src,
            "rating": dom.window.document.querySelector("#ratings-bar div:nth-of-type(1) .empty-star") ? "N/A" : dom.window.document.querySelector("#ratings-bar .vertically-middle").textContent.match(/^([^\/]+)/)[1].trim()
        };
    }

    parse_director_page(d) {
        let dom = new jsdom.JSDOM(d);
        return {
            "directors": Object.values(dom.window.document.querySelectorAll("#fullcredits-content h4")).map(node => node.textContent.trim())
        };
    }

    parse_cast_page(d) {
        let dom = new jsdom.JSDOM(d);
        return {
            "actors": Object.values(dom.window.document.querySelectorAll("#fullcredits-content h4")).map(node => node.textContent.trim())
        };
    }

    async get_series_info(id) {
        let [m, d, c] = await Promise.all([
            simple_https_get("https://m.imdb.com/title/" + id + "/"),
            simple_https_get("https://m.imdb.com/title/" + id + "/fullcredits/director"),
            simple_https_get("https://m.imdb.com/title/" + id + "/fullcredits/cast")
        ]);

        return {
            ...this.parse_main_page(m),
            ...this.parse_director_page(d),
            ...this.parse_cast_page(c)
        };
    }

    async pull_episode_info(id, season) {
        if (!this.cache[id])
            this.cache[id] = {};
        let dom = new jsdom.JSDOM(await simple_https_get("https://www.imdb.com/title/" + id + "/episodes/?season=" + season));
        this.cache[id][season] = Object.values(dom.window.document.querySelectorAll(".eplist > div")).map(episode => {
            return {
                "season": episode.querySelector(".image div:nth-child(2)").textContent.trim().match(/S(\d+),\s*Ep(\d+)/)[1],
                "number": episode.querySelector(".image div:nth-child(2)").textContent.trim().match(/S(\d+),\s*Ep(\d+)/)[2],
                "date": episode.querySelector(".airdate").textContent.trim(),
                "title": episode.querySelector(".info a[title]").textContent.trim(),
                "description": episode.querySelector(".item_description").textContent.trim(),
                "rating": episode.querySelector(".ipl-rating-star.small > span:nth-child(2)").textContent.trim()
            };
        });
    }

    async get_episode_info(id, season, episode) {
        if (!this.cache[id] || !this.cache[id][season])
            await this.pull_episode_info(id, season);

        let info = this.cache[id][season][episode];
        if (info)
            return info;
        else
            throw "IMDB has no info for that episode.";
    }

};

(async () => {
    try {
        let imdbapi = new imdb;
        let id = await imdbapi.find_series_id("Stranger Things");
        console.log(id);
        console.log(await imdbapi.get_series_info(id));
        console.log(await imdbapi.get_episode_info(id, 1, 1));
        console.log(await imdbapi.get_episode_info(id, 1, 2));
        console.log(await imdbapi.get_episode_info(id, 1, 3));
    } catch (e) {
        console.log(e);
    } 
})();

