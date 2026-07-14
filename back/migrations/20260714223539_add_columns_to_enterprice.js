exports.up = function(knex) {
  return knex.schema.alterTable('enterprice', function(table) {
    table.string('type', 50);
    table.string('website', 255);
    table.string('logo_url', 255);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('enterprice', function(table) {
    table.dropColumn('type');
    table.dropColumn('website');
    table.dropColumn('logo_url');
  });
};
