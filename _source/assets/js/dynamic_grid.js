var ImagesGrid = (function($) {

    /* ------------ PRIVATE functions ------------ */

    /**
     * Takes images from the items array (removes them) as
     * long as they fit into a width of maxwidth pixels.
     *
     * @method buildImageRow
     */
    var buildImageRow = function(maxwidth, items, imagesMargin) {
        var row = [], len = 0, item = null, i;
        
        // Build a row of images until longer than maxwidth
        while(items.length > 0 &&
            len + items[0].width + imagesMargin * 2 < maxwidth) {
            item = items.shift();
            row.push(item);
            len += (item.width + imagesMargin * 2);
        }

        // calculate by how many pixels too short?
        var delta = maxwidth - len;

        if (row.length > 0 && delta > 0) {
            var totalRowWidths = 0;
            for (i = 0; i < row.length; i++) {
                totalRowWidths += row[i].width;
            }
            var oldHeight = row[0].height,
                newHeight = oldHeight * (delta + totalRowWidths) / totalRowWidths;
            for (i = 0; i < row.length; i++) {
                item = row[i];
                item.newHeight = newHeight;
                item.newWidth = item.width * (delta + totalRowWidths) / totalRowWidths;
            }
        } else {
            for (i = 0; i < row.length; i++) {
                item = row[i];
                item.newHeight = item.height;
                item.newWidth = item.width;
            }
        }

        return row;
    };
    
    /**
     * Creates a new thumbail in the image area. An attaches a fade in animation
     * to the image.
     */
    var createImageElement = function(parent, item, imagesMargin) {
        var imageContainer = $('<div class="image-container"/>').css({
            margin: imagesMargin + "px"
        });

        var link = $("<a/>").attr({
            href: item.imagePath,
            title: item.title
        }).addClass("colorbox-handle").appendTo(imageContainer);
        
        var img = $("<img/>").attr({
            src: item.url,
            title: item.title
        }).css({
            width: (item.newWidth || 120) + "px",
            height: (item.newHeight || 120) + "px"
        }).hide().appendTo(link).load(function() { $(this).fadeIn(500); });

        parent.find(".clearfix").before(imageContainer);
        item.el = imageContainer;
        return imageContainer;
    };
    
    /**
     * Updates an exisiting tthumbnail in the image area.
     */
    var updateImageElement = function(item) {
        item.el.find("img:first").css({
            width: (item.newWidth || 120) + "px",
            height: (item.newHeight || 120) + "px"
        });
    };
        
    /* ------------ PUBLIC functions ------------ */
    return {
        
        showImages : function(imageContainer, realItems, imagesMargin) {
            // reduce width by 1px due to layout problem in IE
            var containerWidth = imageContainer.width() - 1;
            
            // Make a copy of the array
            var items = realItems.slice();
        
            // calculate rows of images which each row fitting into
            // the specified windowWidth.
            var rows = [], lastItemsLength = -1;
            while(items.length > 0 && items.length != lastItemsLength) {
                lastItemsLength = items.length;
                rows.push(buildImageRow(containerWidth, items, imagesMargin));
            }

            for(var r in rows) {
                for(var i in rows[r]) {
                    var item = rows[r][i];
                    if(item.el) {
                        // this image is already on the screen, update it
                        updateImageElement(item);
                    } else {
                        // create this image
                        createImageElement(imageContainer, item, imagesMargin);
                    }
                }
            }
        }
    };
})(jQuery);

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
    
    ImagesGrid.showImages(element, items, imagesMargin);
    $(window).resize(function() {
        ImagesGrid.showImages(element, items, imagesMargin);
    });

    $(".colorbox-handle").colorbox({
        className: "images-grid-colorbox",
        rel: "images-grid",
        scalePhotos: true,
        scrolling: false,
        maxWidth: "100%",
        maxHeight: "100%",
        fixed: true
    });
});