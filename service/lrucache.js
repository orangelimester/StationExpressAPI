/** Doubly Linked List - [H, ... ,T] **/

class LRUCache {
    constructor(limit = 10) {
      this.size = 0;
      this.limit = limit;
      this.head = null;
      this.tail = null;
      this.map = {};
    }
  
    // Writing node becomes new Head of LinkedList
    write(key, value){
      /* Check limit, if exceeded, remove tail node  
      ** removed tail node's previous node becomes the new tail node
      **/
      this.ensureLimit();
  
      if(!this.head){
        /* If head doesn't exist, this is the first item in cache
        ** it becomes the head and tail Node
        **/
        this.head = this.tail = new Node(key, value);
      }else{
        /* Writing node's next node set as current head node, previous node as null 
        ** this will become the new head node
        **/
        const node = new Node(key, value, this.head);
        /* Current head node's previous node set to writing node */
        this.head.prev = node;
        /* New head node set to writing node 
        ** previous head node is new head node's next node
        ** therefore previous head node's previous node is the new head node
        **/
        this.head = node;
      }
      /* Update the cache map */
      this.map[key] = this.head;
      this.size++;
    }
  
    // Reading node gets removed from cache and written back into cache as new Head
    read(key){
      if(this.map[key]){
        const value = this.map[key].value;
        /* When reading node, remove the node from the cache
        ** it will become the new head node as it is the most recently used node
        **/
        this.remove(key)
        /* Once removed from the cache, reading node gets written into the cache as the new head node */
        this.write(key, value);
        return value;
      }
    }
  
    ensureLimit(){
      if(this.size === this.limit){
        /* As limit reached, tail node is removed from the cache */
        this.remove(this.tail.key)
      }
    }
  
    remove(key){
      const node = this.map[key];

      if(node.prev !== null){
        /* Set removing node's previous node's next node to the removing node's next node */
        node.prev.next = node.next;
      }else{
        /* Since removing node's previous node is null, it's the head node. 
        ** Therefore New head node must point to removing node's next node in the cache
        **/
        this.head = node.next;
      }
  
      if(node.next !== null){
        /* Set removing node's next node's previous node pointer to removing node's previous node pointer */
        node.next.prev = node.prev;
      }else{
        /* Since removing node's next node is null, it is the tail node. 
        ** Therefore, New tail node must point to the removing node's previous node
        **/
        this.tail = node.prev
      }
      delete this.map[key];
      this.size--;
    }
  }

  class Node {
    constructor(key, value, next = null, prev = null) {
      this.key = key;
      this.value = value;
      this.next = next;
      this.prev = prev;
    }
  }
  
  module.exports = LRUCache;