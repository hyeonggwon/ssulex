
class imdb {
    
    constructor() {
        this.series_datas = {
            "tt4574334": {
                "title": "본격 고문왕의 모험",
                "directors": ["김감독", "박감독", "최감독"],
                "actors": ["김듣보", "박듣보", "최듣보"],
                "genres": ["horror", "drama"],
                "type": "TV series",
                "synopsis": "주인공 아무개는 국가 고문술사 시험을 보러 가게 되는데..",
                "thumb_url": "url.com",
                "year": 2020,
                "rating": 2.3,
                "episode": [ "abcd", "efgh" ]
            }
        };

        this.episode_datas = {
            "abcd": {
                "season": 1,
                "number": 1,
                "date": "2020-03-10",
                "title": "타이틀1",
                "description": "설명1",
                "rating": 8.1,
                "length": 1402
            },
            "efgh": {
                "season": 1,
                "number": 2,
                "date": "2020-03-17",
                "title": "타이틀2",
                "description": "설명2",
                "rating": 7.2,
                "length": 1600
            }
        };

        this.series_id = null;
    }

    async find_series_id() {
        if(this.episode) {
            return;
        }
        else {
            let id = 
            this.series_id = id;
        }
    }

    async get_series_info() {
        if(this.episode) {    
            return;
        }
        else {
            let json_string = this.series_datas[series_id];
            let series = JSON.parse(json_string);
            this.episode_id = series.episode;
            return series;
        }
    }

    async get_episode_info() {
        if(this.episode) {
            return;
        }
        else {
            this.episode = [];
            for(let id in this.episode_id) {
                let json_string = this.episode_datas[id];
                this.episode.push(JSON.parse(json_string));
            }
            return this.episode;
        }
    }
};

module.exports = imdb;
