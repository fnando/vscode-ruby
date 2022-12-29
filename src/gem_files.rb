# frozen_string_literal: true

require "json"

def files_for_gem(spec)
  spec.require_paths.each_with_object([]) do |path, buffer|
    root_path = if File.absolute_path?(path)
                  path
                else
                  File.join(spec.gem_dir, path)
                end

    all_entries = Dir[File.join(root_path, "*.rb")]

    all_entries.each do |file|
      relative_path = file.gsub(File.join(root_path, ""), "")
      buffer << relative_path.gsub(".rb", "")
    end

    buffer
  end
end

data = Gem.loaded_specs.each_with_object({}) do |(name, spec), buffer|
  buffer[name] ||= []
  buffer[name] += files_for_gem(spec)

  buffer
end

puts JSON.pretty_generate(data.values.flatten.uniq.sort)
