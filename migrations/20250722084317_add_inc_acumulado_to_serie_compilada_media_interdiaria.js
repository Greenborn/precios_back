exports.up = function(knex) {
  return knex.schema.alterTable('serie_compilada_media_interdiaria', function(table) {
    table.float('inc_acumulado').notNullable().defaultTo(0);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('serie_compilada_media_interdiaria', function(table) {
    table.dropColumn('inc_acumulado');
  });
}; 