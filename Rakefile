source_dir      = "_source"    # source file directory
assets_dir      = source_dir + "/assets/"
css_dir         = assets_dir + "/css/"


# usage rake new_images_collection['path/to/items/dir', 'path/to/dest/and/name']
desc "Begin a new images collection"
task :new_images_collection, :destDir, :itemsDir do |t, args|
    destDir = "#{args.destDir}"
    args.with_defaults(:itemsDir => "#{destDir}/items")
    itemsDir = args.itemsDir

    collectionName = File.basename("#{source_dir}/#{destDir}")
    category = File.basename(File.dirname("#{source_dir}/#{destDir}"))

    filename = "#{source_dir}/#{destDir}/index.html"
    if File.exist?(filename)
        abort("rake aborted!") if ask("#{filename} already exists. Do you want to overwrite?", ['y', 'n']) == 'n'
    end

    mkdir_p "#{source_dir}/#{destDir}"
    puts "Creating new collection: #{filename}"
    open(filename, 'w') do |collection|
        collection.puts "---"
        collection.puts "layout: images-collection"
        collection.puts "title: \"#{collectionName.gsub(/&/,'&amp;')}\""
        collection.puts "sort: 0"
        collection.puts "category: #{category}"
        collection.puts "description:"
        collection.puts "items: ["
        index = 0
        Dir.foreach("#{source_dir}/#{itemsDir}") do |itemFile|
            if File.file?("#{source_dir}/#{itemsDir}/#{itemFile}") and
                not itemFile.start_with?(".")
                puts "Adding #{itemsDir}/#{itemFile} to collection"
                collection.puts "   ," unless index == 0
                collection.puts "   {"
                collection.puts "       imagePath: \"/#{itemsDir}/#{itemFile}\","
                collection.puts "       title: \"\""
                collection.puts "   }"
                index += 1
            end
        end
        collection.puts "]"
        collection.puts "---"
    end
end

def get_stdin(message)
  print message
  STDIN.gets.chomp
end

def ask(message, valid_options)
  if valid_options
    answer = get_stdin("#{message} #{valid_options.to_s.gsub(/"/, '').gsub(/, /,'/')} ") while !valid_options.include?(answer)
  else
    answer = get_stdin(message)
  end
  answer
end