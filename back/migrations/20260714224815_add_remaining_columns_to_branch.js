exports.up = async function(knex) {
  const addColumnIfNotExists = async (column, type, options = {}) => {
    const exists = await knex.schema.hasColumn('branch', column)
    if (!exists) {
      await knex.schema.alterTable('branch', function(table) {
        if (type === 'string') table.string(column, options.length)
        else if (type === 'decimal') table.decimal(column, options.precision, options.scale)
        else if (type === 'text') table.text(column)
      })
    }
  }

  await addColumnIfNotExists('branch_name', 'string', { length: 200 })
  await addColumnIfNotExists('city', 'string', { length: 100 })
  await addColumnIfNotExists('latitude', 'decimal', { precision: 10, scale: 8 })
  await addColumnIfNotExists('longitude', 'decimal', { precision: 11, scale: 8 })
  await addColumnIfNotExists('address', 'string', { length: 500 })
}

exports.down = async function(knex) {
  const dropColumnIfExists = async (column) => {
    const exists = await knex.schema.hasColumn('branch', column)
    if (exists) {
      await knex.schema.alterTable('branch', function(table) {
        table.dropColumn(column)
      })
    }
  }

  await dropColumnIfExists('branch_name')
  await dropColumnIfExists('city')
  await dropColumnIfExists('latitude')
  await dropColumnIfExists('longitude')
  await dropColumnIfExists('address')
}
