
const imdb = require("../imdb.js");
const uuidv1 = require("uuid/v1");

(async () => {
    try {
        let imdbapi = new imdb;
        let titles = [
            "Stranger Things",
            "Evangelion",
            "Heroes", "Chernobyl",
            "The Magic School Bus",
            "The Listener",
            "Wilfred",
            "The Imitation Game"
        ];
        let s = {};
        let e = {};
        for (let title of titles) {
            console.log(title);
            let id = await imdbapi.find_series_id(title);
            let series_info = await imdbapi.get_series_info(id);
            s[id] = series_info;
            if (s[id]["type"] == "TV Series") {
                s[id]["episode"] = [];
                for (let i=1; i<=5; i++) {
                    let uuid = uuidv1();
                    let episode_info = await imdbapi.get_episode_info(id, 1, i);
                    e[uuid] = episode_info;
                    s[id]["episode"].push(uuid);
                }
            }
        }
        console.log(JSON.stringify(s));
        console.log(JSON.stringify(e));
    } catch (e) {
        console.log(e);
    } 
})();

