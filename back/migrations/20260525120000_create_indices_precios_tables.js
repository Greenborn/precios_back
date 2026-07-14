exports.up = function(knex) {
  return knex.schema
    .createTableIfNotExists('indices_precios', function(table) {
      table.string('cod_indice', 255).primary().notNullable();
      table.string('descripcion', 1024);
    })
    .createTableIfNotExists('productos_indice', function(table) {
      table.bigInteger('id_producto').notNullable();
      table.string('cod_indice', 255).notNullable();

      table.primary(['id_producto', 'cod_indice']);
      table.foreign('id_producto').references('id').inTable('products').onUpdate('CASCADE').onDelete('CASCADE');
      table.foreign('cod_indice').references('cod_indice').inTable('indices_precios').onUpdate('CASCADE').onDelete('CASCADE');
    })
    .createTableIfNotExists('registro_indice', function(table) {
      table.string('cod_indice', 255).notNullable();
      table.bigInteger('id_producto').notNullable();
      table.dateTime('datetime').notNullable();
      table.json('data').notNullable();

      table.foreign('cod_indice').references('cod_indice').inTable('indices_precios').onUpdate('CASCADE').onDelete('CASCADE');
      table.foreign('id_producto').references('id').inTable('products').onUpdate('CASCADE').onDelete('CASCADE');
      table.index(['cod_indice', 'id_producto']);
      table.index('datetime');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('registro_indice')
    .dropTableIfExists('productos_indice')
    .dropTableIfExists('indices_precios');
};
