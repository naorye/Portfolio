module Jekyll
    class TopicsGenerator < Jekyll::Generator
        safe true
        priority :lowest

        def initialize(config)
        end

        def buildTopics(site)
            topics = []

            puts "Working on posts topics"
            site.posts.each do |post|
                if post.data["category"] == nil
                    topic = Hash.new
                    topic["name"] = post.data["title"]
                    topic["base"] = post
                    topic["active"] = (post.data["active"] != false)
                    puts topic["name"] + "found"
                    topics.push(topic)
                end
            end

            puts "Working on pages topics"
            site.pages.each do |page|
                if page.data["category"] == nil
                    topic = Hash.new
                    topic["name"] = page.data["title"]
                    topic["base"] = page
                    topic["active"] = (page.data["active"] != false)
                    puts topic["name"] + "found"
                    topics.push(topic)
                end
            end
            return topics
        end

        def buildItems(site, topics)
            topics.each do |topic|
                puts "Searching items for #{topic}"
                items = []
                site.posts.each do |post|
                    if post.data["category"] == topic["name"]
                        puts post.data["title"] + "found"
                        items.push(post)
                    end
                end
                site.pages.each do |page|
                    if page.data["category"] == topic["name"]
                        puts page.data["title"] + "found"
                        items.push(page)
                    end
                end
                topic["items"] = items
            end
        end

        def sort(topics)
            topics = topics.sort do |a,b|
                (a["base"].data["sort"] || 0) <=> (b["base"].data["sort"] || 0)
            end
            topics.each do |topic|
                items = topic["items"]
                if items.size > 0
                    topic["items"] = items.sort {|a,b| (a.data["sort"] || 0) <=> (b.data["sort"] || 0) }
                end
            end
            return topics
        end

        def generate(site)
            config = site.config

            if config["topics_generator"] != true
                return
            end

            puts "Building topics"
            topics = buildTopics(site)
            puts "Building items"
            buildItems(site, topics)
            topics = sort(topics)

            config["topics"] = topics
        end
    end
end