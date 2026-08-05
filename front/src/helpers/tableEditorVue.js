
import DialogConfirm from '@/components/genericos/DialogConfirm'
import FormularioGenerico from '@/components/genericos/FormularioGenerico'
import { AppStore } from '@/stores/app'
import { getCamposJson, mapFilaJSONtabla, getCamposJSONyFieldDef } from './mapCampoJSON'
import { getProcessFieldDef, getFieldDefFFormated } from './procesarFieldDef'
import { row_formatter } from './formatter'

// Convierte la respuesta del backend ({ stat, data: { rows, fields_def, total?, ... } })
// al contrato que espera vue-table-editor ({ status, data: { rows, totalRecords, fields_def } })
// y aplica el mismo preprocesado de filas/campos que hacia el TableEditor local.
export function buildVteList(get_all, { onFieldsDef } = {}) {
  return async function list(params) {
    let res
    try {
      res = await get_all(params)
    } catch (e) {
      res = { stat: false }
    }

    if (!res || res.stat === false) {
      return { status: false, data: { rows: [], fields_def: [], totalRecords: 0 } }
    }

    let { rows = [], fields_def = [], totalRecords, total } = res.data || {}

    if (rows.length > 0) {
      const camposJSON = getCamposJson(fields_def)
      rows = rows.map((r) => {
        let row = mapFilaJSONtabla(r, camposJSON)
        return row_formatter(row, fields_def)
      })
      fields_def = getCamposJSONyFieldDef([...fields_def], camposJSON, rows[0])
    }
    // fields_def completo (incluye copias formateadas con '_' y originales hide:true),
    // se usa para construir los formularios de alta/edicion.
    const full_fields_def = getFieldDefFFormated(fields_def)
    if (onFieldsDef) onFieldsDef(full_fields_def)
    // para la tabla se filtran las columnas ocultas (la libreria no respeta el flag hide).
    const table_fields_def = getProcessFieldDef(full_fields_def)

    const tr = totalRecords ?? total ?? rows.length
    return { status: true, data: { rows, fields_def: table_fields_def, totalRecords: tr } }
  }
}

// Arma la configuracion de botones de CRUD (crear/editar/borrar) que abren los modales
// FormularioGenerico / DialogConfirm, replicando el comportamiento del TableEditor local.
export function buildCrud({ api, campos, campos_extras, singular, gender, storeApp, getTable, getSelected }) {
  const textos = (gender === 'F')
    ? { create: 'Nueva', edit: 'Editar', delete: 'Borrar', article: 'una', deleted: 'eliminada' }
    : { create: 'Nuevo', edit: 'Editar', delete: 'Borrar', article: 'un', deleted: 'eliminado' }

  function camposPara(kind) {
    let arr = [...campos()]
    const extras = (campos_extras && campos_extras[kind]) || []
    for (let c = 0; c < extras.length; c++) arr.push(extras[c])
    return arr
  }

  function refrescar() {
    const t = getTable()
    if (t) t.refresh()
  }

  async function nuevo() {
    storeApp.mostrar_modal(FormularioGenerico, textos.create + ' ' + singular, {
      onSubmit: api.create,
      guardado: () => refrescar(),
      modelo: {},
      campos: camposPara('create'),
      quitar_campos: ['id'],
    })
  }

  async function editar() {
    if (!api.edit) return
    const row = getSelected()
    if (!row) {
      storeApp.mostrar_alerta('Es necesario seleccionar ' + textos.article + ' ' + singular)
      return
    }
    storeApp.mostrar_modal(FormularioGenerico, 'Editar ' + singular, {
      onSubmit: api.edit,
      guardado: () => refrescar(),
      modelo: row,
      campos: camposPara('edit'),
      quitar_campos: ['id'],
    })
  }

  async function confirm_borrar(row) {
    storeApp.loading = true
    const res_borrar = await api.delete({ id: row.id })
    if (res_borrar) {
      storeApp.loading = false
      if (res_borrar.stat) {
        storeApp.mostrar_alerta(singular + ' ' + textos.deleted + ' correctamente')
        refrescar()
      } else {
        storeApp.mostrar_alerta(res_borrar.text)
      }
    } else {
      storeApp.loading = false
      storeApp.mostrar_alerta('Error al realizar petición')
    }
  }

  async function borrar() {
    const row = getSelected()
    if (!row) {
      storeApp.mostrar_alerta('Es necesario seleccionar ' + textos.article + ' ' + singular)
      return
    }
    storeApp.mostrar_modal(DialogConfirm, 'Confirmar', {
      accion_a_confirmar: () => confirm_borrar(row),
      texto: '¿Está seguro?',
    })
  }

  const toolbar = []
  if (api && api.create) toolbar.push({ key: 'create', icon: 'plus', severity: 'success', label: textos.create, onClick: nuevo })
  if (api && api.edit) toolbar.push({ key: 'edit', icon: 'pencil', severity: 'warning', label: textos.edit, isDisabled: () => !getSelected(), onClick: editar })
  if (api && api.delete) toolbar.push({ key: 'delete', icon: 'trash', severity: 'danger', label: textos.delete, isDisabled: () => !getSelected(), onClick: borrar })

  return { toolbar, editarFila: editar }
}

export function toVteElementName(nombre_elemento) {
  return { singular: nombre_elemento.singular, gender: nombre_elemento.genero || 'M' }
}
