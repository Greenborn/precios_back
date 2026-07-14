exports.up = function(knex) {
  return knex.schema.alterTable('enterprice', function(table) {
    table.dropColumn('url_website');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('enterprice', function(table) {
    table.string('url_website', 255);
  });
};
