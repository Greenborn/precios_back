
const express = require('express')
const router = express.Router()
const axios = require("axios")

module.exports = router


router.post('/chat_bot_rsp', async function (req, res) {
  console.log("body ", req.body)

  try {
    if (!req.body?.texto)   return res.status(200).send({ stat: false, items: [], error: true })
    if (!req.body?.user_id) return res.status(200).send({ stat: false, items: [], error: true })
    
    const response = await axios.post('http://localhost:6789/api/chat', {
      userId: req.body.user_id,
      message: req.body.texto
    })
    res.status(200).send({ stat: true, msg: response.data.response })
      
  } catch (error) {
    console.log(error)
    res.status(200).send({ stat: false, items: [], error: true })
  }  
})
