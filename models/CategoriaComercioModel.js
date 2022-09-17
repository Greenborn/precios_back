const BaseModel = require('./BaseModel.js')

module.exports = class CategoriaComercioModel extends BaseModel {

  constructor(){
    super()
  }

  table_config = {
    info: {
      table_descr: "Categoría Comercio",
      table_id: "categoria_comercio",
      id_field: "id"
    },
    fields: [
  
      {
        field: "id_root",
        headerName: "Categoría Principal",
        required: false,
        form_min_max: [2, 64],
      },
      {
        field: "nombre",
        headerName: "Nombre",
        required: true,
        form_min_max: [2, 128],
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