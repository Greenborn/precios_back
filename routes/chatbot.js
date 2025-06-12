
const express = require('express')
const router = express.Router()
const chat_bot = require("../controllers/chat_bot")
module.exports = router


router.get('/chat_bot_rsp', async function (req, res) {
  console.log("query ", req.query)

  try {

    res.status(200).send({ stat: true, msg: chat_bot.get_respuesta(req.query?.msg) })
      
  } catch (error) {
    console.log(error)
    res.status(200).send({ stat: false, items: [], error: true })
  }  
})