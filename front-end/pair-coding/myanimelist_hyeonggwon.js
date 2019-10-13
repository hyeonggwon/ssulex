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

class myanimelist {

    constructor() {
        this.cache = {};
    }

    async find_series_id(keyword) {
        let title = encodeURIComponent(keyword);
        let json = JSON.parse(await simple_https_get("https://myanimelist.net/search/prefix.json?type=anime&keyword=" + title + "&v=1/"));
        if (json["categories"] && json["categories"][0]["items"])
            return json["categories"][0]["items"][0]["id"];
        else
            throw "No suggestion available.";
    }

    parse_main_page(m) {
        let dom = new jsdom.JSDOM(m);
        let title = dom.window.document.querySelector("span[itemprop='name']").textContent.trim();
        return {
            "type": "anime",
            "title": title,
            "year": dom.window.document.querySelector("a[href^='https://myanimelist.net/anime/season/']").textContent.trim(),
            "synopsis": dom.window.document.querySelector("span[itemprop='description']").textContent.trim(),
            "genres": Object.values(dom.window.document.querySelectorAll("a[href^='/anime/genre/'")).map(node => node.textContent.trim()),
            "thumb_url": dom.window.document.querySelector("img[itemprop='image']").src,
            "rating": dom.window.document.querySelector("span[itemprop='ratingValue']").textContent.trim()
        };
    }

    parse_director_page(d) {
        let dom = new jsdom.JSDOM(d);
        let staffs = Object.values(dom.window.document.querySelectorAll("td[class^='borderClass'] > a[href^='https://myanimelist.net/people/']")).map(node => node.textContent.trim());
        let is_directors = Object.values(dom.window.document.querySelectorAll("td[class^='borderClass'] > a[href^='https://myanimelist.net/people/'] ~ .spaceit_pad > small")).map(node => node.textContent.trim());
        let directors = [];
        let first_index = -1;

        for (let i in staffs) {
            if (is_directors[i].match(/^Director/)) {
                if (first_index == -1)
                    first_index = i;
                directors.push(staffs[i]);
            }
            else if (first_index != -1) break;
        }
        
        return {
            "directors": directors
        };
    }

/*
    parse_cast_page(d) {
        let dom = new jsdom.JSDOM(d);
        return {
            "actors": Object.values(dom.window.document.querySelectorAll("#fullcredits-content h4")).map(node => node.textContent.trim())
        };
    }
*/
    async get_series_info(id) {
        
        let [m] = await Promise.all([simple_https_get("https://myanimelist.net/anime/" + id + "/")]);
        let parsed_main_page = this.parse_main_page(m);
        let title = parsed_main_page["title"];
        let [d, c] = await Promise.all([
            simple_https_get("https://myanimelist.net/anime/" + id + '/' + title + "/characters"),
            simple_https_get("https://m.imdb.com/title/" + id + "/fullcredits/cast")
        ]);

        return {
            ...parsed_main_page,
            ...this.parse_director_page(d),
            //...this.parse_cast_page(c)
        };
    }

    async get_title(id) {
        let [m] = await Promise.all([simple_https_get("https://myanimelist.net/anime/" + id + "/")]);
        let dom = new jsdom.JSDOM(m);
        return dom.window.document.querySelector("span[itemprop='name']").textContent.trim();
    }

    async parse_episode_page(id, title, episode) {
        let [e] = await Promise.all([simple_https_get("https://myanimelist.net/anime/" + id + "/" + title + "/episode/" + episode)]);
        let dom = new jsdom.JSDOM(e);
        //let dom = new jsdom.JSDOM(simple_https_get("https://myanimelist.net/anime/" + id + "/" + title + "/episode/" + episode));
        let title_origin = dom.window.document.querySelector(".fs18.lh11").textContent.trim();
        let desc_origin = dom.window.document.querySelector(".pt8.pb8").textContent.trim();
        let thumbnail = dom.window.document.querySelector(".video-embed.clearfix a img");
        return {
            "number": episode,
            "date": dom.window.document.querySelector(".ar.fn-grey2").textContent.split("Aired: ")[1],
            "title": title_origin.substring(dom.window.document.querySelector(".fs18.lh11 .fw-n").textContent.length, title_origin.length).trim(),
            "description": desc_origin.substring(dom.window.document.querySelector(".pt8.pb8 .fw-b").textContent.length, desc_origin.length).trim(),
            "thumb_url": thumbnail == null ? "https://m.media-amazon.com/images/G/01/imdb/images/nopicture/medium/film-3385785534._CB483791896_.png" : thumbnail.src
        }
    }
    async pull_episode_info(id) {
        
        let title = await this.get_title(id);
        let dom = new jsdom.JSDOM(await simple_https_get("https://myanimelist.net/anime/" + id + "/" + title + "/episode"));
        this.cache[id] = [];

        let hundred_over = Object.values(dom.window.document.querySelectorAll(".pagination a"));
        if(hundred_over.length) {
            hundred_over = hundred_over.map(node => node.textContent.trim());
            let splited = hundred_over[hundred_over.length-1].split(' ');
            let total_num = parseInt(splited[splited.length - 1]);
            for(let i = 1; i <= total_num; ++i)
                this.cache[id].push(await this.parse_episode_page(id, title, i));
        }
        else {
            let total_num = dom.window.document.querySelectorAll("table[class='mt8 episode_list js-watch-episode-list descend'] tr td[class='episode-number nowrap']")[0].textContent;
            for(let i = 1; i <= total_num; ++i)
                this.cache[id].push(await this.parse_episode_page(id, title, i));
        }
    }

    async get_episode_info(id, episode) {
        if (!this.cache[id]) {
            await this.pull_episode_info(id);
        }

        let info = this.cache[id][episode];
        if (info)
            return info;
        else
            throw "IMDB has no info for that episode.";
    }

};

(async () => {
    try {
        let imdbapi = new myanimelist;
        let id = await imdbapi.find_series_id("One Punch Man");
        console.log(id);
        console.log(await imdbapi.get_series_info(id));
        for(let i = 0; i < 10; ++i)
            console.log(await imdbapi.get_episode_info(id, i));
    } catch (e) {
        console.log(e);
    } 
})();

module.exports = myanimelist;
