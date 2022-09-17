const BaseModel = require('./BaseModel.js')

module.exports = class UnidadMedidaModel extends BaseModel {

  constructor(){
    super()
  }

  table_config = {
    info: {
      table_descr: "Unidad de medida",
      table_id: "unidad_medida",
      id_field: "id"
    },
    fields: [
      {
        field: "nombre",
        headerName: "Nombre",
        required: true,
        form_min_max: [2, 128],
      },
      {
        field: "abreviacion",
        headerName: "Abreviación",
        required: true,
        form_min_max: [2, 10],
      },
      {
        field: "created_at",
        headerName: "Creado el:",
        required: true,
        form_type: "date",
        editable: false,
        form_min_max: [4, 32],
      },
      {
        field: "edited_at",
        headerName: "Modificado el:",
        required: true,
        form_type: "date",
        editable: false,
        form_min_max: [4, 32],
      }
    ]
  }

  data = {}
}