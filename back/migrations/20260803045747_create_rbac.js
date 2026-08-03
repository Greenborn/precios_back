/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('usuarios', (table) => {
      table.increments('id').primary();
      table.string('name', 128).notNullable();
      table.string('email', 255).unique().notNullable();
      table.string('pass', 255).notNullable();
      table.timestamps('created_at', 'edited_at', true);
    })
    .createTable('roles', (table) => {
      table.increments('id').primary();
      table.string('nombre', 64).unique().notNullable();
      table.string('descripcion', 255).nullable();
      table.timestamps('created_at', 'edited_at', true);
    })
    .createTable('permisos', (table) => {
      table.increments('id').primary();
      table.string('nombre', 100).unique().notNullable();
      table.string('descripcion', 255).nullable();
      table.timestamps('created_at', 'edited_at', true);
    })
    .createTable('rutas', (table) => {
      table.increments('id').primary();
      table.integer('id_ruta_root').unsigned().nullable().references('id').inTable('rutas').onDelete('CASCADE');
      table.string('path', 128).notNullable();
      table.string('componente', 128).nullable();
      table.string('icon', 64).nullable();
      table.string('title', 128).nullable();
      table.integer('orden_visualizacion').notNullable().defaultTo(0);
      table.timestamps('created_at', 'edited_at', true);
    })
    .createTable('usuarios_roles', (table) => {
      table.integer('usuario_id').unsigned().references('id').inTable('usuarios').onDelete('CASCADE');
      table.integer('rol_id').unsigned().references('id').inTable('roles').onDelete('CASCADE');
      table.primary(['usuario_id', 'rol_id']);
    })
    .createTable('roles_permisos', (table) => {
      table.integer('rol_id').unsigned().references('id').inTable('roles').onDelete('CASCADE');
      table.integer('permiso_id').unsigned().references('id').inTable('permisos').onDelete('CASCADE');
      table.primary(['rol_id', 'permiso_id']);
    })
    .createTable('roles_rutas', (table) => {
      table.integer('rol_id').unsigned().references('id').inTable('roles').onDelete('CASCADE');
      table.integer('ruta_id').unsigned().references('id').inTable('rutas').onDelete('CASCADE');
      table.primary(['rol_id', 'ruta_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('roles_rutas')
    .dropTableIfExists('roles_permisos')
    .dropTableIfExists('usuarios_roles')
    .dropTableIfExists('rutas')
    .dropTableIfExists('permisos')
    .dropTableIfExists('roles')
    .dropTableIfExists('usuarios');
};
