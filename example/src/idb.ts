const DB_NAME = "pev2"
const DB_VERSION = 1
let DB

type StoredPlan = Record<string, unknown> & { id?: unknown }
type ImportablePlan = StoredPlan | unknown[]

function deepEqual<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

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

  async importPlans(plans: ImportablePlan[]) {
    const db = await this.getDb()

    return new Promise<number[]>((resolve, reject) => {
      const trans = db.transaction(["plans"], "readwrite")
      const store = trans.objectStore("plans")

      let count = 0;
      let duplicates = 0;

      trans.oncomplete = () => {
        resolve([count, duplicates])
      }

      trans.onerror = () => {
        reject(trans.error)
      }

      for (const plan of plans) {
        if ("id" in plan) delete plan.id;

        const cursorReq = store.openCursor();
        let exists = false;

        cursorReq.onsuccess = (e) => {
          const cursor = e.target.result;
          if (!cursor) {
            // reached end → no duplicate found
            if (!exists) {
              store.add(plan);
              count++;
            }
            return;
          }

          const existing = cursor.value;
          delete existing.id;

          if (deepEqual(existing, plan)) {
            exists = true; // duplicate found
            duplicates++;
            return;        // stop scanning
          }

          cursor.continue();
        };
      }

    })
  },
}
