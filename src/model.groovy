def findById(id) {
  g.v(id)
}

def findByKeyValue(key, value) {
  g.V(key, value)
}

def delete(id) {
  g.removeVertex(g.v(id))
}

def update(id, m) {
  m.each{g.v(id).setProperty(it.key, it.value)}
}

def addEdge(id1, id2, relationship, params) {
	v1 = g.v(id1)
	v2 = g.v(id2)
	g.addEdge(v1, v2, relationship, params)
}


