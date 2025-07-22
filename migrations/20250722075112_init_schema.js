exports.up = function(knex) {
  // Ejemplo: crear tabla de productos
  // return knex.schema.createTable('products', function(table) {
  //   table.increments('id').primary();
  //   table.string('name').notNullable();
  //   table.timestamps(true, true);
  // });
};

exports.down = function(knex) {
  // Ejemplo: revertir creación de tabla
  // return knex.schema.dropTableIfExists('products');
}; 