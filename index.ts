import Sigma from "sigma";
import { Coordinates, EdgeDisplayData, NodeDisplayData } from "sigma/types";
import Graph from "graphology";
import ForceSupervisor from "graphology-layout-force/worker";

// Retrieve some useful DOM elements:
const container = document.getElementById("sigma-container") as HTMLElement;
const searchInput = document.getElementById("search-input") as HTMLInputElement;
const setButton = document.getElementById("set-button") as HTMLButtonElement;
const resetButton = document.getElementById("reset") as HTMLButtonElement;
const searchSuggestions = document.getElementById(
  "suggestions"
) as HTMLDataListElement;

// Instantiate sigma:
const graph = new Graph();

const RED = "#FA4F40";
const BLUE = "#727EE0";
const GREEN = "#5DB346";
const YELLOW = "#FF7900";

graph.addNode("11.0", { size: 45, label: "J.R.R Tolkien", color: RED });
graph.addNode("0.0", { size: 30, label: "Bournemouth", color: BLUE });
graph.addNode("1.0", { size: 30, label: "Bloemfontein", color: BLUE });
graph.addNode("2.0", { size: 30, label: "South Africa", color: BLUE });
graph.addNode("3.0", {
  size: 30,
  label: "The Lord of the Rings (book)",
  color: BLUE
});
graph.addNode("4.0", { size: 30, label: "United Kingdom", color: BLUE });
graph.addNode("5.0", { size: 30, label: "Legolas", color: YELLOW });
graph.addNode("6.0", {
  size: 15,
  label: "The Lord of the Rings (movie)",
  color: GREEN
});
graph.addNode("7.0", { size: 15, label: "Orlando Bloom", color: GREEN });

graph.addEdge("11.0", "1.0", { type: "arrow", label: "born in", size: 5 });
graph.addEdge("11.0", "0.0", { type: "arrow", label: "died in", size: 5 });
graph.addEdge("11.0", "2.0", { type: "arrow", label: "born in", size: 5 });
graph.addEdge("11.0", "3.0", { type: "arrow", label: "author of", size: 5 });
graph.addEdge("11.0", "4.0", { type: "arrow", label: "died in", size: 5 });
graph.addEdge("1.0", "2.0", { type: "arrow", label: "capital of", size: 5 });
graph.addEdge("0.0", "4.0", { type: "arrow", label: "town in", size: 5 });
graph.addEdge("5.0", "11.0", { type: "arrow", label: "created by", size: 5 });
graph.addEdge("5.0", "6.0", { type: "arrow", label: "character in", size: 5 });
graph.addEdge("6.0", "3.0", { type: "arrow", label: "based on", size: 5 });
graph.addEdge("5.0", "3.0", { type: "arrow", label: "character in", size: 5 });
graph.addEdge("7.0", "5.0", { type: "arrow", label: "potrayed by", size: 5 });
// graph.import(data);

graph.nodes().forEach((node, i) => {
  const angle = (i * 2 * Math.PI) / graph.order;
  graph.setNodeAttribute(node, "x", 100 * Math.cos(angle));
  graph.setNodeAttribute(node, "y", 100 * Math.sin(angle));
});



resetButton.onclick = function () {
  document.location.reload();
};

var set = true;
// Create the spring layout and start it
const layout = new ForceSupervisor(graph, {
  isNodeFixed: (_, attr) => attr.highlighted
});

if (set) {
  layout.start();
}

setButton.onclick = function () {
  console.log(setButton.value);
  console.log(set);
  if (setButton.value === "off") {
    set = true;
    setButton.value = "on";
    setButton.textContent = "Live on!";
    layout.start();
  } else {
    set = false;
    setButton.value = "off";
    setButton.textContent = "Live off!";
    layout.stop();
  }
};

const renderer = new Sigma(graph, container, {
  renderEdgeLabels: true
});

// State for drag'n'drop
let draggedNode: string | null = null;
let isDragging = false;

renderer.on("downNode", (e) => {
  isDragging = true;
  draggedNode = e.node;
  graph.setNodeAttribute(draggedNode, "highlighted", true);
});

// On mouse move, if the drag mode is enabled, we change the position of the draggedNode
renderer.getMouseCaptor().on("mousemovebody", (e) => {
  if (!isDragging || !draggedNode) return;

  // Get new position of node
  const pos = renderer.viewportToGraph(e);

  graph.setNodeAttribute(draggedNode, "x", pos.x);
  graph.setNodeAttribute(draggedNode, "y", pos.y);

  // Prevent sigma to move camera:
  e.preventSigmaDefault();
  e.original.preventDefault();
  e.original.stopPropagation();
});

// On mouse up, we reset the autoscale and the dragging mode
renderer.getMouseCaptor().on("mouseup", () => {
  if (draggedNode) {
    graph.removeNodeAttribute(draggedNode, "highlighted");
  }
  isDragging = false;
  draggedNode = null;
});

// Disable the autoscale at the first down interaction
renderer.getMouseCaptor().on("mousedown", () => {
  if (!renderer.getCustomBBox()) renderer.setCustomBBox(renderer.getBBox());
});

//
// Create node (and edge) by click
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//

// When clicking on the stage, we add a new node and connect it to the closest node
// renderer.on("clickStage", ({ event }: { event: { x: number; y: number } }) => {
//   // Sigma (ie. graph) and screen (viewport) coordinates are not the same.
//   // So we need to translate the screen x & y coordinates to the graph one by calling the sigma helper `viewportToGraph`
//   const coordForGraph = renderer.viewportToGraph({ x: event.x, y: event.y });

//   // We create a new node
//   const node = {
//     ...coordForGraph,
//     size: 10,
//     color: chroma.random().hex()
//   };

//   // Searching the two closest nodes to auto-create an edge to it
//   const closestNodes = graph
//     .nodes()
//     .map((nodeId) => {
//       const attrs = graph.getNodeAttributes(nodeId);
//       const distance =
//         Math.pow(node.x - attrs.x, 2) + Math.pow(node.y - attrs.y, 2);
//       return { nodeId, distance };
//     })
//     .sort((a, b) => a.distance - b.distance)
//     .slice(0, 2);

//   // We register the new node into graphology instance
//   const id = uuid();
//   graph.addNode(id, node);

//   // We create the edges
//   closestNodes.forEach((e) => graph.addEdge(id, e.nodeId));
// });

// Type and declare internal state:
interface State {
  hoveredNode?: string;
  searchQuery: string;

  // State derived from query:
  selectedNode?: string;
  suggestions?: Set<string>;

  // State derived from hovered node:
  hoveredNeighbors?: Set<string>;
}
const state: State = { searchQuery: "" };

// Feed the datalist autocomplete values:
searchSuggestions.innerHTML = graph
  .nodes()
  .map(
    (node) =>
      `<option value="${graph.getNodeAttribute(node, "label")}"></option>`
  )
  .join("\n");

// Actions:

function setSearchQuery(query: string) {
  state.searchQuery = query;

  if (searchInput.value !== query) searchInput.value = query;

  if (query) {
    const lcQuery = query.toLowerCase();
    const suggestions = graph
      .nodes()
      .map((n) => ({
        id: n,
        label: graph.getNodeAttribute(n, "label") as string
      }))
      .filter(({ label }) => label.toLowerCase().includes(lcQuery));

    // If we have a single perfect match, them we remove the suggestions, and
    // we consider the user has selected a node through the datalist
    // autocomplete:
    if (suggestions.length === 1) {
      var sugg = suggestions[0];
      if(sugg){
        if(sugg.label === query){
          state.selectedNode = sugg.id;
          state.suggestions = undefined;
        }
      }

      // Move the camera to center it on the selected node:
      const nodePosition = renderer.getNodeDisplayData(
        state.selectedNode
      ) as Coordinates;
      renderer.getCamera().animate(nodePosition, {
        duration: 500
      });
    }
    // Else, we display the suggestions list:
    else {
      state.selectedNode = undefined;
      state.suggestions = new Set(suggestions.map(({ id }) => id));
    }
  }
  // If the query is empty, then we reset the selectedNode / suggestions state:
  else {
    state.selectedNode = undefined;
    state.suggestions = undefined;
  }

  // Refresh rendering:
  renderer.refresh();
}
function setHoveredNode(node?: string) {
  if (node) {
    state.hoveredNode = node;
    state.hoveredNeighbors = new Set(graph.neighbors(node));
  } else {
    state.hoveredNode = undefined;
    state.hoveredNeighbors = undefined;
  }

  // Refresh rendering:
  renderer.refresh();
}

// Bind search input interactions:
searchInput.addEventListener("input", () => {
  setSearchQuery(searchInput.value || "");
});
searchInput.addEventListener("blur", () => {
  setSearchQuery("");
});

// Bind graph interactions:
renderer.on("enterNode", ({ node }) => {
  setHoveredNode(node);
});
renderer.on("leaveNode", () => {
  setHoveredNode(undefined);
});

// Render nodes accordingly to the internal state:
// 1. If a node is selected, it is highlighted
// 2. If there is query, all non-matching nodes are greyed
// 3. If there is a hovered node, all non-neighbor nodes are greyed
renderer.setSetting("nodeReducer", (node, data) => {
  const res: Partial<NodeDisplayData> = { ...data };

  if (
    state.hoveredNeighbors &&
    !state.hoveredNeighbors.has(node) &&
    state.hoveredNode !== node
  ) {
    res.label = "";
    res.color = "#f6f6f6";
  }

  if (state.selectedNode === node) {
    res.highlighted = true;
  } else if (state.suggestions && !state.suggestions.has(node)) {
    res.label = "";
    res.color = "#f6f6f6";
  }

  return res;
});

// Render edges accordingly to the internal state:
// 1. If a node is hovered, the edge is hidden if it is not connected to the
//    node
// 2. If there is a query, the edge is only visible if it connects two
//    suggestions
renderer.setSetting("edgeReducer", (edge, data) => {
  const res: Partial<EdgeDisplayData> = { ...data };

  if (state.hoveredNode && !graph.hasExtremity(edge, state.hoveredNode)) {
    res.hidden = true;
  }

  if (
    state.suggestions &&
    (!state.suggestions.has(graph.source(edge)) ||
      !state.suggestions.has(graph.target(edge)))
  ) {
    res.hidden = true;
  }

  return res;
});
