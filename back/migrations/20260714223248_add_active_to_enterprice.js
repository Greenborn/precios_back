exports.up = function(knex) {
  return knex.schema.alterTable('enterprice', function(table) {
    table.boolean('active').defaultTo(true);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('enterprice', function(table) {
    table.dropColumn('active');
  });
};
