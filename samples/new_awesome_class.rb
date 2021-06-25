# frozen_string_literal: true

require "yaml"

p YAML.safe_load("foo: #{Date.now}")
