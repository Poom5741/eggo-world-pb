import { Router } from 'express'
import { getScannerStatus, triggerScan } from '../depositScanner.js'

const router = Router()

router.get('/status', (_req, res) => {
  res.json(getScannerStatus())
})

router.post('/trigger', async (_req, res) => {
  try {
    await triggerScan()
    res.json({ success: true, message: 'Scan triggered' })
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } })
  }
})

export { router as depositScannerRouter }
