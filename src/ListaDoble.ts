/**
 * Nodo de una Lista Doblemente Enlazada.
 *  - data: la canción
 *  - next: apunta al nodo siguiente (null si es el último)
 *  - prev: apunta al nodo anterior (null si es el primero)
 *
 *   null <- [A] <-> [B] <-> [C] -> null
 *           head              tail
 */
export class Nodo<T> {
  data: T;
  next: Nodo<T> | null = null;
  prev: Nodo<T> | null = null;

  constructor(data: T) {
    this.data = data;
  }
}

export class ListaDoble<T extends { id: string }> {
  head: Nodo<T> | null = null; // primer nodo
  tail: Nodo<T> | null = null; // último nodo
  current: Nodo<T> | null = null; // nodo que está sonando
  size = 0;

  /** Inserta al inicio. Costo O(1). */
  agregarAlInicio(cancion: T): void {
    const nuevo = new Nodo(cancion);
    if (this.head === null) {
      // Lista vacía: el nuevo nodo es head, tail y current a la vez.
      this.head = this.tail = this.current = nuevo;
    } else {
      nuevo.next = this.head; // el nuevo apunta hacia adelante al viejo head
      this.head.prev = nuevo; // el viejo head apunta hacia atrás al nuevo
      this.head = nuevo; // el nuevo pasa a ser head
    }
    this.size++;
  }

  /** Inserta al final. Costo O(1) gracias a que tenemos tail. */
  agregarAlFinal(cancion: T): void {
    const nuevo = new Nodo(cancion);
    if (this.tail === null) {
      this.head = this.tail = this.current = nuevo;
    } else {
      nuevo.prev = this.tail; // el nuevo apunta hacia atrás al viejo tail
      this.tail.next = nuevo; // el viejo tail apunta hacia adelante al nuevo
      this.tail = nuevo; // el nuevo pasa a ser tail
    }
    this.size++;
  }

  /** Inserta en la posición index (base 0). Válido de 0 hasta size. */
  agregarEnPosicion(index: number, cancion: T): void {
    if (!Number.isInteger(index) || index < 0 || index > this.size) {
      throw new RangeError(`Posición inválida: ${index}. Debe estar entre 0 y ${this.size}.`);
    }
    if (index === 0) return this.agregarAlInicio(cancion);
    if (index === this.size) return this.agregarAlFinal(cancion);

    // Caso intermedio: recorremos hasta el nodo que hoy ocupa esa posición.
    let actual = this.head as Nodo<T>;
    for (let i = 0; i < index; i++) actual = actual.next as Nodo<T>;

    const anterior = actual.prev as Nodo<T>; // existe porque index > 0
    const nuevo = new Nodo(cancion);

    // Se enlaza el nuevo entre "anterior" y "actual" (4 punteros):
    nuevo.prev = anterior;
    nuevo.next = actual;
    anterior.next = nuevo;
    actual.prev = nuevo;
    this.size++;
  }

  /** Elimina por id. Devuelve true si la encontró. */
  eliminarCancion(id: string): boolean {
    let nodo = this.head;
    while (nodo !== null && nodo.data.id !== id) nodo = nodo.next;
    if (nodo === null) return false;

    // "Puentear" el nodo: el anterior salta hacia el siguiente y viceversa.
    if (nodo.prev !== null) nodo.prev.next = nodo.next;
    else this.head = nodo.next; // era el head

    if (nodo.next !== null) nodo.next.prev = nodo.prev;
    else this.tail = nodo.prev; // era el tail

    // Si se eliminó la que sonaba, pasa a la siguiente (o a la anterior si era la última).
    if (this.current === nodo) this.current = nodo.next ?? nodo.prev;

    nodo.next = nodo.prev = null; // soltamos los punteros del nodo eliminado
    this.size--;
    return true;
  }

  /** Mueve current hacia adelante (si hay next) y devuelve la canción actual. */
  siguiente(): T | null {
    if (this.current !== null && this.current.next !== null) {
      this.current = this.current.next;
    }
    return this.current ? this.current.data : null;
  }

  /** Mueve current hacia atrás (si hay prev) y devuelve la canción actual. */
  anterior(): T | null {
    if (this.current !== null && this.current.prev !== null) {
      this.current = this.current.prev;
    }
    return this.current ? this.current.data : null;
  }

  /** Reproduce una canción específica (al hacer clic en la lista). */
  seleccionar(id: string): boolean {
    let nodo = this.head;
    while (nodo !== null && nodo.data.id !== id) nodo = nodo.next;
    if (nodo === null) return false;
    this.current = nodo;
    return true;
  }

  /** Recorre de head a tail sin usar arrays (para pintar el DOM). */
  recorrer(callback: (data: T, index: number, esActual: boolean) => void): void {
    let nodo = this.head;
    let i = 0;
    while (nodo !== null) {
      callback(nodo.data, i, nodo === this.current);
      nodo = nodo.next;
      i++;
    }
  }

  tieneSiguiente(): boolean {
    return this.current !== null && this.current.next !== null;
  }

  tieneAnterior(): boolean {
    return this.current !== null && this.current.prev !== null;
  }
}
