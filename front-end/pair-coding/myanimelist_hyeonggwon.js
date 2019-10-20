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
        return {
            "type": "anime",
            "title": dom.window.document.querySelector("span[itemprop='name']").textContent.trim(),
            "year": dom.window.document.querySelector("a[href^='https://myanimelist.net/anime/season/']").textContent.trim(),
            "synopsis": dom.window.document.querySelector("span[itemprop='description']").textContent.trim(),
            "genres": Object.values(dom.window.document.querySelectorAll("a[href^='/anime/genre/'")).map(node => node.textContent.trim()),
            "thumb_url": dom.window.document.querySelector("img[itemprop='image']").src,
            "rating": dom.window.document.querySelector("span[itemprop='ratingValue']").textContent.trim()
        };
    }

    parse_staff_actor_page(d) {
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
            "directors": directors,
            "actors": Object.values(dom.window.document.querySelectorAll("td[class^='borderClass'] td[align='right'] a[href^='https://myanimelist.net/people/']")).map(node => node.textContent.trim())
        };
    }

    async get_series_info(id) {
        let [m, s] = await Promise.all([
            simple_https_get("https://myanimelist.net/anime/" + id + "/"),
            simple_https_get("https://myanimelist.net/anime/" + id + "/" + id + "/characters")
        ]);

        return {
            ...this.parse_main_page(m),
            ...this.parse_staff_actor_page(s)
        };
    }

    // 전체 에피소드를 불러와서 캐시에 통째로 저장하는 방식
    /*
    async pull_divided_episode(id, offset) {
        let dom = new jsdom.JSDOM(await simple_https_get("https://myanimelist.net/anime/" + id + "/" + id + "/episode?offset=" + offset));
        this.cache[id] = this.cache[id].concat(Object.values(dom.window.document.querySelectorAll(".ascend .episode-list-data")).map(episode => {
            return {
                "number": episode.querySelector("td[class='episode-number nowrap']").textContent.trim(),
                "date": episode.querySelector("td[class='episode-aired nowrap']").textContent.trim(),
                "title": episode.querySelector(".episode-title a").textContent.trim(),
                "description": episode.querySelector(".episode-title span").textContent.trim()
            }
        }));
    }
    async pull_episode_info(id) {
        let dom = new jsdom.JSDOM(await simple_https_get("https://myanimelist.net/anime/" + id + "/" + id + "/episode"));
        this.cache[id] = [];

        let hundred_over = Object.values(dom.window.document.querySelectorAll(".pagination a"));
        if(hundred_over.length) {
            hundred_over = hundred_over.map(node => node.textContent.trim());
            let splited = hundred_over[hundred_over.length-1].split(' ');
            let end = parseInt(parseInt(splited[splited.length - 1]) / 100) * 100;
            for(let offset = 0; offset <= end; offset += 100)
                await this.pull_divided_episode(id, offset);
        }
        else
           await this.pull_divided_episode(id, 0);
    }

    async get_episode_info(id, episode) {
        if (!this.cache[id])
            await this.pull_episode_info(id);

        let info = this.cache[id][episode];
        if (info)
            return info;
        else
            throw "IMDB has no info for that episode.";
    }
    */

    // 에피소드를 100개 단위로 불러와서 캐시에 100개 단위로 나누어 저장하는 방식
    async pull_episode_info(id, hundred_offset) {
        if (!this.cache[id])
            this.cache[id] = {};
        let dom = new jsdom.JSDOM(await simple_https_get("https://myanimelist.net/anime/" + id + "/" + id + "/episode?offset=" + (hundred_offset * 100)));
        this.cache[id][hundred_offset] = Object.values(dom.window.document.querySelectorAll(".ascend .episode-list-data")).map(episode => {
            return {
                "number": episode.querySelector("td[class='episode-number nowrap']").textContent.trim(),
                "date": episode.querySelector("td[class='episode-aired nowrap']").textContent.trim(),
                "title": episode.querySelector(".episode-title a").textContent.trim(),
                "sub_title": episode.querySelector(".episode-title span").textContent.trim()
            }
        });
    }

    async get_episode_info(id, hundred_offset, episode) {
        if (!this.cache[id] || !this.cache[id][hundred_offset])
            await this.pull_episode_info(id, hundred_offset);

        let info = this.cache[id][hundred_offset][episode];
        if (info)
            return info;
        else
            throw "IMDB has no info for that episode.";
    }

};

(async () => {
    try {
        let myanimelistapi = new myanimelist;
        let id = await myanimelistapi.find_series_id("One Piece");
        console.log(id);
        console.log(await myanimelistapi.get_series_info(id));
        for(let i = 0; i < 3; ++i)
            console.log(await myanimelistapi.get_episode_info(id, 0, i));
    } catch (e) {
        console.log(e);
    } 
})();

module.exports = myanimelist;
