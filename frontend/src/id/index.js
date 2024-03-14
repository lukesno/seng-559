
export function setSocketID(socketID) {
  console.log(`setting socketID: ${socketID}`)
  localStorage.setItem("socketID", socketID)
}

export function getSocketID() {
  return localStorage.getItem("socketID")
}