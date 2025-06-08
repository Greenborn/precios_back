
const express = require('express')
var router = express.Router()
module.exports = router


router.get('/chat_bot_rsp', async function (req, res) {
  console.log("query ", req.query)

  try {

    res.status(200).send({ stat: true, msg: '' })
      
  } catch (error) {
    console.log(error)
    res.status(200).send({ stat: false, items: [], error: true })
  }  
})