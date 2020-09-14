class Series {
    constructor(title, imageUrl, id, provider) {
        this.title = title;
        this.imageUrl = imageUrl;
        this.id = id;
        this.provider = provider;
    }
}
/*class popularSeries {
    constructor(title, imageUrl, summary, popularity, id) {
        this.title = title;
        this.imageUrl = imageUrl;
        this.summary = summary;
        this.popularity = popularity;
        this.id = id;
    }
}*/


module.exports = Series;