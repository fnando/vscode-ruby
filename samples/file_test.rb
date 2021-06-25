# frozen_string_literal: true

# This is a nice class
class UserTest < Minitest::TestCase
end

refute_equal 1, 2
assert_equal 1, 1
flunk
