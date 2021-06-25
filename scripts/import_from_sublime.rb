# frozen_string_literal: true

require "nokogiri"
require "json"
require "fileutils"

def process_body(body)
  body
    .gsub(
      "${1:${TM_FILENAME/(?:\\A|_)([A-Za-z0-9]+)(?:\\.rb)?/(?2::\\u$1)/g}}",
      "${TM_FILENAME_BASE/(?:^|_)([A-Za-z0-9]+)/${1:/capitalize}/g}"
    )
    .gsub(/\$\{TM_QUOTE\}/m, '"')
    .strip
end

source_path = File.expand_path(
  "#{__dir__}/../../sublime-better-ruby/snippets/**/*.sublime-snippet"
)

scope_mapping = {
  "meta.rails.integration_test" => "source.ruby.test"
  # "source.ruby" => "source.ruby, source.ruby.test, source.ruby.bundler, source.ruby.puma"
}

groups = Hash.new {|h, k| h[k] = {} }

Dir[source_path].sort.each do |file|
  xml = Nokogiri::XML(File.read(file))
  basename = File.basename(file, ".*")
  dirname = File.basename(File.dirname(file))

  body = xml.css("snippet > content").text
  prefix = xml.css("snippet > tabTrigger").text
  scope = xml.css("snippet > scope").text
  description = xml.css("snippet > description").text

  override_path = File.join(__dir__, "..", "snippets", dirname,
                            "#{basename}.code-snippets")

  if File.file?(override_path)
    body = JSON.parse(File.read(override_path)).dig(basename, "body")
  end

  snippet = {
    scope: scope_mapping[scope] || scope[/^([^ ]+).*?$/, 1],
    prefix: prefix,
    description: description,
    body: process_body(body)
  }

  groups[dirname][basename] = snippet
end

groups.each do |basename, snippets|
  output_path = "./snippets/#{basename}.code-snippets"

  File.open(output_path, "w+") do |io|
    io << JSON.pretty_generate(snippets)
  end
end
