$(document).ready(function() {
    var element = $(".images-grid"),
        imagesMargin = element.data("imagesMargin"),
        images = element.find("img"),
        items = [];
    images.each(function() {
        var $this = $(this);
        items.push({
            url: $this.attr("src"),
            title: $this.attr("title"),
            width: parseInt($this.data("width"), 10),
            height: parseInt($this.data("height"), 10),
            imagePath: $this.data("imagePath")
        });
    });
    images.remove();

    element.photosGrid({
        data: items,
        data_width: "width",
        data_height: "height",
        data_url: "url",
        data_href: "imagePath",
        fitWidthLastRow: false,
        mode: "increase",
        margin: imagesMargin,
        handleWindowResize: true
    });

    element.find(".photo-anchor").colorbox({
        className: "images-grid-colorbox",
        rel: "images-grid",
        scalePhotos: true,
        scrolling: false,
        maxWidth: "100%",
        maxHeight: "100%",
        fixed: true
    });
});