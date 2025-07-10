const uuid = require("uuid")
module.exports = class BaseModel {

  status = false

  constructor( ){
    
  }

  async getAll(){
    
    let res_all = await global.knex(this.table_config.info.table_id).select()
    if (res_all){
      return {
        info: this.table_config.info,
        fields_def: this.table_config.fields,
        rows: res_all
      }
    }
  }

  complete( data ){
    for (let c=0; c < this.table_config.fields.length; c++){
      let field = this.table_config.fields[c]
      //solo se asignan los valores de los campos configurados
      if (data.hasOwnProperty(field.field))
        this.data[field.field] = data[field.field]
      //si existe id, tambien se define
      if (data.hasOwnProperty(this.table_config.info.id_field))
        this.data[this.table_config.info.id_field] = data[this.table_config.info.id_field]
    }
  }

  isValid(){
    return true
  }

  update(){

  }

  async create(){
    this.status = false
    this.data[this.table_config.info.id_field] = uuid.v4()
    let hoy = new Date().toISOString()
    this.data['created_at'] = hoy
    this.data['edited_at'] = hoy
    try {
      let nuevo_reg = await global.knex(this.table_config.info.table_id).insert(this.data)
      if (nuevo_reg){
        this.status = true
        return true
      }
    } catch( error ){
      console.log('ERROR Base Model',this.data, error)
      return false
    }
  }

  exists(){

  }
}