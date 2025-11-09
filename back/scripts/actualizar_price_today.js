require("dotenv").config({ path: '../.env' })
const { resolve, join } = require('path')

// Configuración de conexión (igual que el servidor y demás scripts)
let conn_obj = {
  host: process.env.mysql_host,
  // port: process.env.mysql_port,
  user: process.env.mysql_user,
  password: process.env.mysql_password,
  database: process.env.mysql_database,
  connectTimeout: 600000, // 10 minutos para evitar timeouts en datasets grandes
  supportBigNumbers: true,
  bigNumberStrings: true,
  typeCast: function (field, next) {
    if (field.type == "NEWDECIMAL") {
      var value = field.string();
      return (value === null) ? null : Number(value);
    }
    return next();
  }
}

const knex = require('knex')({
  client: 'mysql2',
  connection: conn_obj,
  pool: { min: 0, max: 1000, propagateCreateError: false },
  collation: 'utf8mb4_unicode_ci'
})

process.env.TZ = 'America/Argentina/Buenos_Aires'
const CHUNK_SIZE = parseInt(process.env.PRICE_TODAY_CHUNK_SIZE || '5000')

async function actualizarPriceToday() {
  console.log('[price_today] Inicio de actualización')

  // Obtener todas las combinaciones a procesar
  const combos = await knex('price').distinct('product_id', 'branch_id')
  const total = combos.length
  let processed = 0
  console.log(`[price_today] Combinaciones a procesar: ${total}`)

  for (let i = 0; i < combos.length; i += CHUNK_SIZE) {
    const chunk = combos.slice(i, i + CHUNK_SIZE)

    const trx = await knex.transaction()
    try {
      // Tabla temporal con pares a procesar
      await trx.raw('DROP TEMPORARY TABLE IF EXISTS tmp_pairs')
      await trx.raw('DROP TEMPORARY TABLE IF EXISTS tmp_latest')
      await trx.raw('CREATE TEMPORARY TABLE tmp_pairs (product_id VARCHAR(36), branch_id INT)')

      const values = chunk.map(r => `('${r.product_id}', ${Number(r.branch_id)})`).join(',')
      if (values.length > 0) {
        await trx.raw(`INSERT INTO tmp_pairs (product_id, branch_id) VALUES ${values}`)
      }

      // Seleccionar el último registro por cada par limitado a tmp_pairs, excluyendo precios igual a 0 y precios de más de un mes de antigüedad
      await trx.raw(`
        CREATE TEMPORARY TABLE tmp_latest AS 
        SELECT 
          p.id AS id,
          p.product_id,
          p.price,
          p.date_time,
          p.user_id,
          p.branch_id,
          p.es_oferta,
          p.porcentage_oferta,
          p.confiabilidad,
          p.url,
          p.notas,
          p.time,
          pr.name AS product_name,
          p.id AS price_id
        FROM price p
        INNER JOIN tmp_pairs tp ON p.product_id = tp.product_id AND p.branch_id = tp.branch_id
        INNER JOIN (
          SELECT 
            tp.product_id,
            tp.branch_id,
            MAX(CONCAT(
              DATE_FORMAT(p.date_time,'%Y-%m-%d %H:%i:%s'),'|',
              IFNULL(DATE_FORMAT(p.time,'%Y-%m-%d %H:%i:%s'),'0000-00-00 00:00:00'),
              '|', p.id
            )) AS mx
          FROM price p
          INNER JOIN tmp_pairs tp ON p.product_id = tp.product_id AND p.branch_id = tp.branch_id
          WHERE p.price > 0 AND p.date_time >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
          GROUP BY tp.product_id, tp.branch_id
        ) t 
          ON p.product_id = t.product_id 
         AND p.branch_id  = t.branch_id 
         AND CONCAT(
           DATE_FORMAT(p.date_time,'%Y-%m-%d %H:%i:%s'),'|',
           IFNULL(DATE_FORMAT(p.time,'%Y-%m-%d %H:%i:%s'),'0000-00-00 00:00:00'),
           '|', p.id
         ) = t.mx
        INNER JOIN products pr ON pr.id = p.product_id
        WHERE p.price > 0 AND p.date_time >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
      `)

      // Eliminar registros con precio 0 de price_today para las combinaciones del chunk
      await trx.raw(`
        DELETE pt 
        FROM price_today pt
        INNER JOIN tmp_pairs tp ON pt.product_id = tp.product_id AND pt.branch_id = tp.branch_id
        WHERE pt.price = 0
      `)
      // Reemplazar combinaciones del chunk (solo las que tienen precio > 0)
      await trx.raw(`
        DELETE pt 
        FROM price_today pt
        INNER JOIN tmp_latest t
          ON pt.product_id = t.product_id AND pt.branch_id = t.branch_id
      `)

      await trx.raw(`
        INSERT INTO price_today (
          id,
          product_id,
          price,
          date_time,
          user_id,
          branch_id,
          es_oferta,
          porcentage_oferta,
          confiabilidad,
          url,
          notas,
          time,
          product_name,
          price_id
        )
        SELECT 
          id,
          product_id,
          price,
          date_time,
          user_id,
          branch_id,
          es_oferta,
          porcentage_oferta,
          confiabilidad,
          url,
          notas,
          time,
          product_name,
          price_id
        FROM tmp_latest
        WHERE price > 0
      `)

      await trx.raw('DROP TEMPORARY TABLE IF EXISTS tmp_pairs')
      await trx.raw('DROP TEMPORARY TABLE IF EXISTS tmp_latest')
      await trx.commit()

      processed += chunk.length
      console.log(`[price_today] Progreso: ${processed}/${total} combinaciones actualizadas`)
    } catch (err) {
      console.error('[price_today] Error en chunk:', err)
      try { await trx.rollback() } catch {}
      process.exit(1)
    }
  }

  console.log('[price_today] Actualización completada')
  process.exit(0)
}

// Ejecutar directamente cuando se invoca este script
actualizarPriceToday()