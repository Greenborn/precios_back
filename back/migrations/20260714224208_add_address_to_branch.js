exports.up = function(knex) {
  return knex.schema.alterTable('branch', function(table) {
    table.string('address', 500);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('branch', function(table) {
    table.dropColumn('address');
  });
};
