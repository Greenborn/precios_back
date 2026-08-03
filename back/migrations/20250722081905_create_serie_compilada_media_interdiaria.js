exports.up = async function(knex) {
  await knex.schema.createTable('serie_compilada_media_interdiaria', function(table) {
    table.increments('id').primary();
    table.date('date').notNullable();
    table.float('mean_inc').notNullable();
    table.float('median_inc').notNullable();
    table.float('std_inc').notNullable();
    table.integer('count').notNullable();
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('serie_compilada_media_interdiaria');
};
