var ImagesGrid = (function($) {

    /* ------------ PRIVATE functions ------------ */

    /** Utility function that returns a value or the defaultvalue if the value is null */
    var $nz = function(value, defaultvalue) {
        if( typeof (value) === undefined || value === null) {
            return defaultvalue;
        }
        return value;
    };
    
    /**
     * Distribute a delta (integer value) to n items based on
     * the size (width) of the items thumbnails.
     *
     * @method calculateCutOff
     * @property len the sum of the width of all thumbnails
     * @property delta the delta (integer number) to be distributed
     * @property items an array with items of one row
     */
    var calculateCutOff = function(len, delta, items) {
        // resulting distribution
        var cutoff = [];
        var cutsum = 0;

        // distribute the delta based on the proportion of
        // thumbnail size to length of all thumbnails.
        for(var i in items) {
            var item = items[i];
            var fractOfLen = item.width / len;
            cutoff[i] = Math.floor(fractOfLen * delta);
            cutsum += cutoff[i];
        }

        // still more pixel to distribute because of decimal
        // fractions that were omitted.
        var stillToCutOff = delta - cutsum;
        while(stillToCutOff > 0) {
            for(i in cutoff) {
                // distribute pixels evenly until done
                cutoff[i]++;
                stillToCutOff--;
                if (stillToCutOff === 0) break;
            }
        }
        return cutoff;
    };
    
    /**
     * Takes images from the items array (removes them) as
     * long as they fit into a width of maxwidth pixels.
     *
     * @method buildImageRow
     */
    var buildImageRow = function(maxwidth, items) {
        var row = [], len = 0, item = null;
        
        // each image a has a 3px margin, i.e. it takes 6px additional space
        var marginOfImage = 10;

        // Build a row of images until longer than maxwidth
        while(items.length > 0 && len < maxwidth) {
            item = items.shift();
            row.push(item);
            len += (item.width + marginOfImage * 2);
            item.margin = marginOfImage;
        }

        // calculate by how many pixels too long?
        var delta = len - maxwidth;

        // if the line is too long, make images smaller
        if(row.length > 0 && delta > 0) {

            // calculate the distribution to each image in the row
            var cutoff = calculateCutOff(len, delta, row);

            for(var i in row) {
                var pixelsToRemove = cutoff[i];
                item = row[i];

                // move the left border inwards by half the pixels
                item.x = Math.floor(pixelsToRemove / 2);

                // shrink the width of the image by pixelsToRemove
                item.viewWidth = item.width - pixelsToRemove;
            }
        } else {
            // all images fit in the row, set x and viewWidth
            for(var j in row) {
                item = row[j];
                item.x = 0;
                item.viewWidth = item.width;
            }
        }

        return row;
    };
    
    /**
     * Creates a new thumbail in the image area. An attaches a fade in animation
     * to the image.
     */
    var createImageElement = function(parent, item) {
        var imageContainer = $('<div class="image-container"/>').css({
            margin: item.margin + "px"
        });

        var overflow = $("<div/>").css({
            width: $nz(item.viewWidth, 120) + "px",
            height: $nz(item.height, 120) + "px",
            overflow: "hidden"
        }).appendTo(imageContainer);

        var link = $("<a/>").attr({
            href: item.imagePath,
            title: item.title
        }).addClass("colorbox-handle").appendTo(overflow);
        
        var img = $("<img/>").attr({
            src: item.url,
            title: item.title,
            width: $nz(item.width, 120) + "px",
            height: $nz(item.height, 120) + "px",
            "margin-left": (item.x ? (-item.x) : 0) + "px",
            "margin-top": 0 + "px"
        }).hide().appendTo(link).load(function() { $(this).fadeIn(500); });

        parent.find(".clearfix").before(imageContainer);
        item.el = imageContainer;
        return imageContainer;
    };
    
    /**
     * Updates an exisiting tthumbnail in the image area.
     */
    var updateImageElement = function(item) {
        var overflow = item.el.find("div:first");
        var img = overflow.find("img:first");

        overflow.css("width", "" + $nz(item.viewWidth, 120) + "px");
        overflow.css("height", "" + $nz(item.height, 120) + "px");

        img.css("margin-left", "" + (item.x ? (-item.x) : 0) + "px");
        img.css("margin-top", "" + 0 + "px");
    };
        
    /* ------------ PUBLIC functions ------------ */
    return {
        
        showImages : function(imageContainer, realItems) {
            // reduce width by 1px due to layout problem in IE
            var containerWidth = imageContainer.width() - 1;
            
            // Make a copy of the array
            var items = realItems.slice();
        
            // calculate rows of images which each row fitting into
            // the specified windowWidth.
            var rows = [], lastItemsLength = -1;
            while(items.length > 0 && items.length != lastItemsLength) {
                lastItemsLength = items.length;
                rows.push(buildImageRow(containerWidth, items));
            }

            for(var r in rows) {
                for(var i in rows[r]) {
                    var item = rows[r][i];
                    if(item.el) {
                        // this image is already on the screen, update it
                        updateImageElement(item);
                    } else {
                        // create this image
                        createImageElement(imageContainer, item);
                    }
                }
            }
        }
    };
})(jQuery);

$(document).ready(function() {
    var element = $(".images-grid");
    var images = element.find("img");
    var items = [];
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
    
    ImagesGrid.showImages(element, items);
    $(window).resize(function() {
        ImagesGrid.showImages(element, items);
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





