require "fastimage"
require "fastimage_resize"

module Jekyll

    # Recover from strange exception when starting server without --auto
    class ThumbnailFile < StaticFile
        def write(dest)
            begin
                super(dest)
            rescue
            end

            true
        end
    end

    class DynamicGridGenerator < Jekyll::Generator
        safe true
        priority :lowest

        def initialize(config)
        end

        # base represents page or post
        def generateItems(site, base)
            items =  base.data["items"]
            base.data["imagesMargin"] = (base.data["imagesMargin"] || site.config["imagesMargin"] || 10).to_f
            source = site.source
            dest = site.dest
            thumbnailsFolderName = "thumbnails"
            thumbnailHeight = (base.data["thumbnailsHeight"] || site.config["thumbnailsHeight"] || 120).to_f
            items.each do |item|
                imagePath = item["imagePath"]
                imageFileName = File.basename(imagePath)
                directoryName = File.dirname(imagePath)

                imagePath = source + imagePath
                thumbnailDirectory = directoryName + "/" + thumbnailsFolderName + "/"
                thumbnailPath = dest + thumbnailDirectory + imageFileName

                # Set thumbnail size
                imageSize = FastImage.size(imagePath)
                imageHeight = imageSize[1].to_f
                imageWidth = imageSize[0].to_f
                item["height"] = thumbnailHeight
                item["width"] = imageWidth * (thumbnailHeight / imageHeight)

                # Creating thumbnail
                puts "Creating thumbnail " + thumbnailDirectory + imageFileName + " " + item["width"].to_s + "X" + item["height"].to_s + " ..."

                # Ensure thumbnailPath exists
                FileUtils.makedirs(dest + thumbnailDirectory)

                # Creates thumbnail
                FastImage.resize(imagePath, 2 * item["width"], 2 * item["height"], :outfile => thumbnailPath)

                # Registers thumbnail in order to prevent Jekyll delete the file
                site.static_files << Jekyll::ThumbnailFile.new(site, dest, thumbnailDirectory, imageFileName)
                
                item["thumbnailPath"] = thumbnailDirectory + imageFileName
            end
            return items
        end

        def loopBaseElements(site, baseElements)
            baseElements.each do |base|
                if base.data["layout"] == "dynamic_grid"
                    base.data["items"] = generateItems(site, base)
                end
            end
        end

        def generate(site)
            config = site.config

            if config["dynamic_grid_generator"] != true
                return
            end

            loopBaseElements(site, site.posts)
            loopBaseElements(site, site.pages)

            puts "Done generate dynamic grid."
        end
    end
end

#{"imagePath"=>"/photography/grid/items/sivan030.jpg",
# "height"=>100,
# "width"=>100,
# "title"=>"",
# "thumbnailPath"=>"/Users/naorye/dev/naorye/ilana/_site/photography/grid/items/thumbnails/sivan030.jpg"}


