(function($) {

    function inherit(base, methods) {
        var sub = function() {
            base.apply(this, arguments);
        };
        sub.prototype = Object.create(base.prototype);
        $.extend(sub.prototype, methods);
        return sub;
    }

    var Utils = {
        parseSize: function(size) {
            size = parseFloat(size);
            if (isNaN(size)) {
                size = null;
            }
            return size;
        }
    };

    var GridRowGenerator = function(container, margin, options) {
        this.container = container;
        this.margin = margin;
        this.options = $.extend({}, this.defaults, options);
    };
    $.extend(GridRowGenerator.prototype, {
        generateGridRowModel: function() {
            throw "GridRowGenerator is abstract.";
        },
        getGenerator: function() {
            return $.proxy(this.generateGridRowModel, this);
        },
        defaults: {
        }
    });

    var DecreasedGridRowGenerator = inherit(GridRowGenerator, {
        calculateCutOff: function(len, delta, items) {
            var cutoff = [],
                cutsum = 0,
                i;

            // Distribute the delta based on the proportion of thumbnail size to
            // length of all thumbnails.
            for (i in items) {
                var item = items[i],
                    fractOfLen = item.width / len;
                cutoff[i] = Math.floor(fractOfLen * delta);
                cutsum += cutoff[i];
            }

            // Still more pixel to distribute because of decimal fractions that were omitted.
            var stillToCutOff = delta - cutsum;
            while (stillToCutOff > 0) {
                for (i = 0; i < cutoff.length && stillToCutOff > 0; i++) {
                    // distribute pixels evenly until done
                    cutoff[i]++;
                    stillToCutOff--;
                }
            }
            return cutoff;
        },
        generateGridRowModel: function(items) {
            var row = [],
                len = 0,
                totalWidth = this.container.width() - 1;

            while (items.length > 0 && len < totalWidth) {
                item = items.shift();
                row.push(item);
                len += (item.width + this.margin * 2);
            }

            var delta = len - totalWidth;

            if (row.length > 0 && delta > 0) {

                var cutoff = this.calculateCutOff(len, delta, row);

                for (var i = 0; i < row.length; i++) {
                    var pixelsToRemove = cutoff[i];
                    item = row[i];

                    // move the left border inwards by half the pixels
                    item.left_margin = Math.floor(pixelsToRemove / 2);

                    // shrink the width of the image by pixelsToRemove
                    item.wrapper_width = item.width - pixelsToRemove;
                    item.wrapper_height = item.height;
                }
            } else {
                // all images fit in the row, set x and viewWidth
                for(var j in row) {
                    item = row[j];
                    item.left_margin = 0;
                    item.wrapper_width = item.width;
                    item.wrapper_height = item.height;
                }
            }

            return row;
        }
    });

    var IncreasedGridRowGenerator = inherit(GridRowGenerator, {
        defaults: {
            fitWidthLastRow: false
        },
        generateGridRowModel: function(items) {
            var row = [],
                len = 0,
                item = null,
                i,
                totalWidth = this.container.width() - 1;

            // Build a row of images until longer than totalWidth
            while (items.length > 0 &&
                len + items[0].width + this.margin * 2 <= totalWidth) {
                item = items.shift();
                row.push(item);
                len += (item.width + this.margin * 2);
            }

            // In case one image with padding is more then total width, the
            // first while loop creates an empty row. So we need to reduce the
            // first image so it will fit the total width
            if (row.length === 0 && items.length > 0 &&
                len + items[0].width + this.margin * 2 > totalWidth) {
                item = items.shift();

                var oldWidth = item.width;
                item.width = totalWidth - this.margin * 2;
                item.height = item.height * item.width / oldWidth;

                row.push(item);
                len += (item.width + this.margin * 2);
            }

            var fixRowWidth = true;

            // There is no need to fix width of the last row. items.length === 0
            // indicated this is the last row.
            if (items.length === 0 && !this.options.fitWidthLastRow) {
                fixRowWidth = false;
            }

            var delta = totalWidth - len;

            if (fixRowWidth && row.length > 0 && delta > 0) {
                var totalRowWidths = 0;
                for (i = 0; i < row.length; i++) {
                    totalRowWidths += row[i].width;
                }
                var growthRatio = (delta + totalRowWidths) / totalRowWidths,
                    oldHeight = row[0].height,
                    newHeight = oldHeight * growthRatio;

                for (i = 0; i < row.length; i++) {
                    item = row[i];
                    item.height = item.wrapper_height = newHeight;
                    item.width = item.wrapper_width = item.width * growthRatio;
                }
            } else {
                for (i = 0; i < row.length; i++) {
                    item = row[i];
                    item.wrapper_height = item.height;
                    item.wrapper_width = item.width;
                }
            }

            return row;
        }
    });

    var PhotosGrid = function (container, options) {
        this.container = container;
        this.parseOptions(options);

        this.fetchData($.proxy(this.dataFetched, this));
    };
    $.extend(PhotosGrid.prototype, {
        defaults: {
            url: null,
            data: null,
            dataFetcher: null,
            data_photoUrl: "url",
            data_height: "height",
            data_width: "width",
            data_href: "href",
            mode: "decrease",
            maxWidth: null,
            margin: 3,
            handleWindowResize: true,
            photoClickCallback: null
        },
        parseOptions: function(options) {
            options = options || {};
            this.options = $.extend({}, this.defaults, options);
            this.margin = Utils.parseSize(this.options.margin);
            this.setMaxWidth(this.options.maxWidth);
            this.setMode(this.options.mode);
        },
        setMaxWidth: function(maxWidth) {
            maxWidth = Utils.parseSize(maxWidth);
            if (maxWidth) {
                this.container.css("max-width", maxWidth);
            } else {
                this.container.css("max-width", "");
            }
        },
        setMode: function(mode) {
            var generator = null;
            mode = mode && mode.toLowerCase();
            this.generateGridRowModel = null;
            switch(mode) {
                case "increase":
                    generator = new IncreasedGridRowGenerator(this.container, this.margin, this.options);
                    this.generateGridRowModel = generator.getGenerator();
                    break;
                case "decrease":
                    generator = new DecreasedGridRowGenerator(this.container, this.margin, this.options);
                    this.generateGridRowModel = generator.getGenerator();
                    break;
                default:
                    throw mode + " is not a valid mode. use increase / decrease only.";
            }
        },
        fetchData: function(callback) {
            if (this.options.data) {
                callback(this.options.data);
            } else if (this.options.url) {
                $.getJSON(this.options.url, callback);
            } else if (this.options.dataFetcher &&
                typeof this.options.dataFetcher === "function") {
                this.options.dataFetcher(callback);
            }
        },
        dataFetched: function(items) {
            this.items = items;
            this.renderGrid();

            if (this.options.handleWindowResize) {
                $(window).resize($.proxy(this.renderGrid, this));
            }
        },
        createItemsCopy: function() {
            var itemsCopy = [];
            for (var i = 0; i < this.items.length; i++) {
                itemsCopy.push({
                    url: this.items[i][this.options.data_photoUrl],
                    width: this.items[i][this.options.data_width],
                    height: this.items[i][this.options.data_height],
                    href: this.items[i][this.options.data_href],
                    originalItem: this.items[i]
                });
            }
            return itemsCopy;
        },
        generateGridModel: function() {
            var itemsCopy = this.createItemsCopy();
            var rows = [],
                lastItemsLength = -1;
            // We have to validate that the array's length has changed each iteration
            // to prevent endless loop.
            while (itemsCopy.length > 0 && itemsCopy.length != lastItemsLength) {
                lastItemsLength = itemsCopy.length;
                var row = this.generateGridRowModel(itemsCopy);
                rows.push(row);
            }

            return rows;
        },
        createPhoto: function(photo) {
            if (!photo) { return; }
            var photoStructure =
                "<div class='photo-container'>" +
                    "<div class='photo-wrapper'>" +
                        "<a class='photo-anchor'><img /></a>" +
                    "</div>" +
                "</div>";

            var photoElem = $(photoStructure).css({
                margin: this.margin + "px"
            });
            photoElem.find(".photo-wrapper").css({
                width: (photo.wrapper_width || 120) + "px",
                height: (photo.wrapper_height || 120) + "px"
            });

            /* jshint scripturl:true */
            var href = photo.href ? photo.href : "javascript:void(0);";
            photoElem.find(".photo-anchor")
                .attr("href", href)
                .click($.proxy(function() {
                    var photoClickCallback = this.options.photoClickCallback,
                        container = this.container;
                    if (photoClickCallback &&
                        typeof photoClickCallback === "function") {
                        photoClickCallback(photo.originalItem);
                    }
                    container.trigger("photo-click", photo.originalItem);
                }, this));
            photoElem.find("img")
                .attr("src", photo.url)
                .css({
                    width: (photo.width || 120) + "px",
                    height: (photo.height || 120) + "px",
                    "margin-left": (photo.left_margin ? -photo.left_margin : 0) +"px"
                });

            return photoElem;
        },
        renderGrid: function() {
            this.container.empty();

            var gridModel = this.generateGridModel();

            var clearfix = $("<div class='clearfix'></div>")
                .appendTo(this.container);

            for(var rowIndex in gridModel) {
                for(var photoIndex in gridModel[rowIndex]) {
                    var photo = gridModel[rowIndex][photoIndex];
                    this.createPhoto(photo).insertBefore(clearfix);
                }
            }
        }
    });

    $.fn.photosGrid = function(options) {
        var photosGrid = new PhotosGrid(this, options);
        this.data("photosGrid", photosGrid);
        return this;
    };

})(jQuery);