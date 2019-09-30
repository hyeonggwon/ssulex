
const imdb = require("../imdb.js");

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
        let ret = {};
        for (let title of titles) {
            console.log(title);
            let id = await imdbapi.find_series_id(title);
            let series_info = await imdbapi.get_series_info(id);
            ret[id] = series_info;
        }
        console.log(JSON.stringify(ret));
    } catch (e) {
        console.log(e);
    } 
})();

