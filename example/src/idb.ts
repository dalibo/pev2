const DB_NAME = "pev2"
const DB_VERSION = 1
let DB

export default {
  async getDb() {
    return new Promise((resolve, reject) => {
      if (DB) {
        return resolve(DB)
      }
      console.log("OPENING DB", DB)
      const request = window.indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = (e) => {
        console.log("Error opening db", e)
        reject("Error")
      }

      request.onsuccess = () => {
        DB = request.result
        resolve(DB)
      }

      request.onupgradeneeded = () => {
        console.log("onupgradeneeded")
        const db = request.result
        db.createObjectStore("plans", { autoIncrement: true, keyPath: "id" })
      }
    })
  },
  async deletePlan(plan) {
    const db = await this.getDb()

    return new Promise<void>((resolve) => {
      const trans = db.transaction(["plans"], "readwrite")
      trans.oncomplete = () => {
        resolve()
      }

      const store = trans.objectStore("plans")
      store.delete(plan.id)
    })
  },

  async getPlans() {
    const db = await this.getDb()

    return new Promise((resolve) => {
      const trans = db.transaction(["plans"], "readonly")
      trans.oncomplete = () => {
        resolve(plans)
      }

      const store = trans.objectStore("plans")
      const plans = []

      store.openCursor().onsuccess = (e) => {
        const cursor = e.target.result
        if (cursor) {
          plans.push(cursor.value)
          cursor.continue()
        }
      }
    })
  },

  async savePlan(plan) {
    const db = await this.getDb()

    return new Promise<void>((resolve) => {
      const trans = db.transaction(["plans"], "readwrite")
      trans.oncomplete = () => {
        resolve()
      }

      const store = trans.objectStore("plans")
      store.put(plan)
    })
  },
}
