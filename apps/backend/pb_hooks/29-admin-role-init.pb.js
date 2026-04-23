onRecordView("users", (e) => {
  if (!e.record.get("admin")) {
    e.record.set("admin", false)
  }
})
