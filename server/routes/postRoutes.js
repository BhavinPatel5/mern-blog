const {Router} = require('express')

const router = Router()

router.get('/', (req, res,next) => {
  res.json('This is the posts Route')
})

module.exports = router