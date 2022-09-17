
module.exports = class BaseModel {

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

  }

  isValid(){
    return true
  }

  update(){

  }

  create(){

  }
}