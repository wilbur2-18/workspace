/**
 * 静态图布局（无外部依赖）— 供 GraphCanvasChart 调用
 */
(function () {
  function buildAdjacency(nodes, edges, undirected) {
    const adj = new Map();
    nodes.forEach((n) => adj.set(n.id, []));
    edges.forEach((e) => {
      if (!adj.has(e.from) || !adj.has(e.to)) return;
      adj.get(e.from).push(e.to);
      if (undirected) adj.get(e.to).push(e.from);
    });
    return adj;
  }

  function bfsLayers(adj, startId, maxDepth) {
    const depth = new Map([[startId, 0]]);
    const queue = [startId];
    while (queue.length) {
      const cur = queue.shift();
      const d = depth.get(cur);
      if (maxDepth != null && d >= maxDepth) continue;
      (adj.get(cur) || []).forEach((next) => {
        if (!depth.has(next)) {
          depth.set(next, d + 1);
          queue.push(next);
        }
      });
    }
    return depth;
  }

  function groupBy(items, keyFn) {
    const groups = new Map();
    items.forEach((item) => {
      const key = keyFn(item);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });
    return groups;
  }

  function groupByLayer(depthMap) {
    const layers = new Map();
    depthMap.forEach((d, id) => {
      if (!layers.has(d)) layers.set(d, []);
      layers.get(d).push(id);
    });
    return layers;
  }

  function nodeById(nodes) {
    const map = new Map();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }

  function stableHash(text) {
    let h = 2166136261;
    String(text || '').split('').forEach((ch) => {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 16777619);
    });
    return h >>> 0;
  }

  function scoreNode(node, degreeMap) {
    const risk = Number(node.riskScore);
    if (!Number.isNaN(risk)) return risk;
    const weight = Number(node.weight);
    if (!Number.isNaN(weight)) return weight * 20;
    return (degreeMap.get(node.id) || 0) * 12;
  }

  function degreeMap(nodes, edges) {
    const map = new Map(nodes.map((n) => [n.id, 0]));
    edges.forEach((e) => {
      if (map.has(e.from)) map.set(e.from, map.get(e.from) + 1);
      if (map.has(e.to)) map.set(e.to, map.get(e.to) + 1);
    });
    return map;
  }

  function sortByScore(nodes, edges) {
    const degrees = degreeMap(nodes, edges);
    return [...nodes].sort((a, b) => {
      const ds = scoreNode(b, degrees) - scoreNode(a, degrees);
      if (ds) return ds;
      return String(a.label || a.id).localeCompare(String(b.label || b.id), 'zh-Hans-CN');
    });
  }

  /** 按最长标签估算环上相邻节点最小弧长（像素） */
  function estimateMinArcPx(nodes, ids, floorPx) {
    if (!ids.length) return floorPx;
    const lookup = nodeById(nodes);
    let maxLen = 4;
    ids.forEach((id) => {
      const label = lookup.get(id)?.label || '';
      maxLen = Math.max(maxLen, String(label).length);
    });
    const charPx = 8;
    const chord = Math.max(maxLen * charPx, 52);
    return Math.max(floorPx, chord);
  }

  function ringRadiusForCount(count, baseRadius, minArcPx) {
    if (count <= 1) return baseRadius;
    const minArc = Math.max(minArcPx, 64);
    const needed = (count * minArc) / (2 * Math.PI);
    return Math.max(baseRadius, needed);
  }

  function placeOnRing(ids, cx, cy, radius, startAngle, minArcPx) {
    const map = new Map();
    const n = ids.length;
    const r = ringRadiusForCount(n, radius, minArcPx || 52);
    ids.forEach((id, i) => {
      const angle = startAngle + (2 * Math.PI * i) / Math.max(n, 1);
      map.set(id, { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
    });
    return map;
  }

  const MAX_NODES_PER_RING = 22;

  /** 单层节点过多时拆成多圈，避免挤成一条线 */
  function placeLayerOnRings(ids, cx, cy, startRadius, layerGap, nodes, minArcFloor) {
    const out = new Map();
    if (!ids.length) return { positions: out, outerR: startRadius };
    const chunks = [];
    for (let i = 0; i < ids.length; i += MAX_NODES_PER_RING) {
      chunks.push(ids.slice(i, i + MAX_NODES_PER_RING));
    }
    let r = startRadius;
    chunks.forEach((chunk, idx) => {
      const minArc = estimateMinArcPx(nodes, chunk, minArcFloor);
      const stepGap = idx === 0 ? layerGap : layerGap * 0.82;
      r = Math.max(r + stepGap, ringRadiusForCount(chunk.length, r, minArc));
      placeOnRing(chunk, cx, cy, r, -Math.PI / 2, minArc).forEach((p, id) => out.set(id, p));
    });
    return { positions: out, outerR: r };
  }

  function normalizeToPlot(positions, plot, margin) {
    if (!positions.size) return positions;
    const m = margin ?? 48;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    positions.forEach((p) => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });
    const boxW = Math.max(maxX - minX, 1);
    const boxH = Math.max(maxY - minY, 1);
    const targetW = Math.max(plot.plotWidth - m * 2, 120);
    const targetH = Math.max(plot.plotHeight - m * 2, 120);
    const scale = Math.min(targetW / boxW, targetH / boxH, 1);
    const cx = plot.padX + plot.plotWidth / 2;
    const cy = plot.padY + plot.plotHeight / 2;
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const fitted = new Map();
    positions.forEach((p, id) => {
      fitted.set(id, {
        x: cx + (p.x - midX) * scale,
        y: cy + (p.y - midY) * scale,
      });
    });
    return fitted;
  }

  function collisionRadius(node) {
    const symbolRadius = Math.max(13, (node.size || 24) * 0.48);
    const labelLen = String(node.label || '').length;
    const labelAllowance = Math.min(8, Math.max(0, labelLen - 6) * 1.1);
    return Math.min(28, symbolRadius + labelAllowance);
  }

  function clampPositions(positions, nodes, plot, margin) {
    const lookup = nodeById(nodes);
    const m = margin ?? 28;
    positions.forEach((p, id) => {
      const r = collisionRadius(lookup.get(id) || {}) + 4;
      const minX = plot.padX + m + r;
      const maxX = plot.padX + plot.plotWidth - m - r;
      const minY = plot.padY + m + r;
      const maxY = plot.padY + plot.plotHeight - m - r;
      p.x = Math.max(minX, Math.min(maxX, p.x));
      p.y = Math.max(minY, Math.min(maxY, p.y));
    });
    return positions;
  }

  function resolveCollisions(positions, nodes, plot, options) {
    if (!positions.size || nodes.length < 2) return positions;
    const lookup = nodeById(nodes);
    const ids = nodes.map((n) => n.id).filter((id) => positions.has(id));
    const iterations = options?.iterations || 8;
    const padding = options?.padding || 10;
    const strength = options?.strength || 0.62;

    for (let pass = 0; pass < iterations; pass += 1) {
      for (let i = 0; i < ids.length; i += 1) {
        for (let j = i + 1; j < ids.length; j += 1) {
          const idA = ids[i];
          const idB = ids[j];
          const a = lookup.get(idA) || {};
          const b = lookup.get(idB) || {};
          const pa = positions.get(idA);
          const pb = positions.get(idB);
          let dx = pb.x - pa.x;
          let dy = pb.y - pa.y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          if (!dist) {
            const angle = ((stableHash(idA + idB) % 360) / 180) * Math.PI;
            dx = Math.cos(angle);
            dy = Math.sin(angle);
            dist = 1;
          }
          const minDist = collisionRadius(a) + collisionRadius(b) + padding;
          if (dist >= minDist) continue;
          const overlap = (minDist - dist) * strength;
          const ux = dx / dist;
          const uy = dy / dist;
          const moveA = a.fixed ? 0 : b.fixed ? 1 : 0.5;
          const moveB = b.fixed ? 0 : a.fixed ? 1 : 0.5;
          pa.x -= ux * overlap * moveA;
          pa.y -= uy * overlap * moveA;
          pb.x += ux * overlap * moveB;
          pb.y += uy * overlap * moveB;
        }
      }
      clampPositions(positions, nodes, plot, options?.margin || 24);
    }
    return positions;
  }

  function finalizePositions(positions, nodes, plot, margin, options) {
    const fitted = normalizeToPlot(positions, plot, margin);
    return resolveCollisions(fitted, nodes, plot, {
      iterations: options?.iterations || 8,
      padding: options?.padding || 10,
      strength: options?.strength || 0.62,
      margin: margin ?? 36,
    });
  }

  function placeOrphanGrid(ids, plot) {
    const map = new Map();
    const cols = 6;
    const cellW = 108;
    const cellH = 42;
    const startX = plot.padX + plot.plotWidth - cols * cellW - 24;
    const startY = plot.padY + 24;
    ids.forEach((id, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      map.set(id, { x: startX + col * cellW + cellW / 2, y: startY + row * cellH });
    });
    return map;
  }

  function force(nodes, edges, plot, meta) {
    const cx = plot.padX + plot.plotWidth / 2;
    const cy = plot.padY + plot.plotHeight / 2;
    const groups = [...new Set(nodes.map((n) => n.groupId || n.type || 'default'))];
    const groupIndex = new Map(groups.map((g, i) => [g, i]));
    const groupCenters = new Map();
    const positions = new Map();
    const velocities = new Map();
    const index = nodeById(nodes);
    const radius = Math.min(plot.plotWidth, plot.plotHeight) * 0.34;

    groups.forEach((group, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(groups.length, 1);
      groupCenters.set(group, {
        x: cx + radius * 0.78 * Math.cos(angle),
        y: cy + radius * 0.78 * Math.sin(angle),
      });
    });

    nodes.forEach((node) => {
      const gi = groupIndex.get(node.groupId || node.type || 'default') || 0;
      const baseAngle = -Math.PI / 2 + (2 * Math.PI * gi) / Math.max(groups.length, 1);
      const jitter = (stableHash(node.id) % 1000) / 1000;
      const r = node.fixed ? 0 : radius * (0.55 + jitter * 0.45);
      positions.set(node.id, {
        x: node.fixed ? cx : cx + r * Math.cos(baseAngle + jitter * 0.72),
        y: node.fixed ? cy : cy + r * Math.sin(baseAngle + jitter * 0.72),
      });
      velocities.set(node.id, { x: 0, y: 0 });
    });

    const iterations = meta?.iterations || 150;
    const repulsion = meta?.repulsion || 5200;
    const idealEdgeLength = meta?.idealEdgeLength || 132;
    const edgeStrength = meta?.edgeStrength || 0.014;
    const collisionPadding = meta?.collisionPadding || 22;
    const groupGravity = meta?.groupGravity || 0.018;

    for (let k = 0; k < iterations; k += 1) {
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          const pa = positions.get(a.id);
          const pb = positions.get(b.id);
          let dx = pb.x - pa.x;
          let dy = pb.y - pa.y;
          let dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const push = repulsion / (dist * dist);
          const minDist = (a.size || 24) + (b.size || 24) + collisionPadding;
          const collide = dist < minDist ? (minDist - dist) * 0.055 : 0;
          dx /= dist;
          dy /= dist;
          const fx = (push + collide) * dx;
          const fy = (push + collide) * dy;
          const va = velocities.get(a.id);
          const vb = velocities.get(b.id);
          if (!a.fixed) {
            va.x -= fx;
            va.y -= fy;
          }
          if (!b.fixed) {
            vb.x += fx;
            vb.y += fy;
          }
        }
      }

      edges.forEach((edge) => {
        const a = index.get(edge.from);
        const b = index.get(edge.to);
        if (!a || !b) return;
        const pa = positions.get(a.id);
        const pb = positions.get(b.id);
        let dx = pb.x - pa.x;
        let dy = pb.y - pa.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        dx /= dist;
        dy /= dist;
        const targetLength = edge.pathKey ? idealEdgeLength * 0.72 : edge.weight >= 2 ? idealEdgeLength * 0.82 : idealEdgeLength;
        const pull = (dist - targetLength) * edgeStrength * (edge.weight || 1);
        const va = velocities.get(a.id);
        const vb = velocities.get(b.id);
        if (!a.fixed) {
          va.x += pull * dx;
          va.y += pull * dy;
        }
        if (!b.fixed) {
          vb.x -= pull * dx;
          vb.y -= pull * dy;
        }
      });

      nodes.forEach((node) => {
        if (node.fixed) return;
        const p = positions.get(node.id);
        const v = velocities.get(node.id);
        const groupCenter = groupCenters.get(node.groupId || node.type || 'default');
        if (groupCenter) {
          v.x += (groupCenter.x - p.x) * groupGravity;
          v.y += (groupCenter.y - p.y) * groupGravity;
        }
        p.x += Math.max(-10, Math.min(10, v.x));
        p.y += Math.max(-10, Math.min(10, v.y));
        v.x *= 0.72;
        v.y *= 0.72;
      });
    }
    return finalizePositions(positions, nodes, plot, 64, { iterations: 28, padding: 10, strength: 0.82 });
  }

  function radial(nodes, edges, plot, centerId, meta) {
    const cx = plot.padX + plot.plotWidth / 2;
    const cy = plot.padY + plot.plotHeight / 2;
    const start = centerId && nodes.some((n) => n.id === centerId) ? centerId : nodes[0]?.id;
    if (!start) return new Map();

    const hasExplicitDepth = nodes.some((n) => Number.isFinite(Number(n.radialDepth)));
    const depth = new Map();
    if (hasExplicitDepth) {
      nodes.forEach((n) => depth.set(n.id, Math.max(0, Number(n.radialDepth) || 0)));
    } else {
      const adj = buildAdjacency(nodes, edges, true);
      bfsLayers(adj, start, 6).forEach((d, id) => depth.set(id, d));
      nodes.forEach((n) => {
        if (!depth.has(n.id)) depth.set(n.id, 7);
      });
    }

    const ranked = sortByScore(nodes, edges).map((n) => n.id);
    const rankMap = new Map(ranked.map((id, i) => [id, i]));
    const layers = groupByLayer(depth);
    const positions = new Map();
    positions.set(start, { x: cx, y: cy });

    const layerGap = meta?.layerGap || 116;
    const subRingGap = meta?.subRingGap || 46;
    const orphans = [];
    [...layers.keys()].sort((a, b) => a - b).forEach((layer) => {
      if (layer === 0) return;
      const others = layers.get(layer)
        .filter((id) => id !== start)
        .sort((a, b) => (rankMap.get(a) || 0) - (rankMap.get(b) || 0));
      if (!others.length) return;
      if (layer >= 6) {
        orphans.push(...others);
        return;
      }
      for (let i = 0; i < others.length; i += MAX_NODES_PER_RING) {
        const chunk = others.slice(i, i + MAX_NODES_PER_RING);
        const chunkIndex = Math.floor(i / MAX_NODES_PER_RING);
        const minArc = estimateMinArcPx(nodes, chunk, layer >= 3 ? 98 : 88);
        const baseR = Math.max(layer * layerGap, 72);
        const ringR = ringRadiusForCount(chunk.length, baseR + chunkIndex * subRingGap, minArc);
        const offset = chunkIndex % 2 ? -Math.PI / 2 + Math.PI / Math.max(chunk.length, 1) : -Math.PI / 2;
        placeOnRing(chunk, cx, cy, ringR, offset, minArc).forEach((p, id) => positions.set(id, p));
      }
    });
    if (orphans.length) {
      placeOrphanGrid(orphans, plot).forEach((p, id) => positions.set(id, p));
    }
    return normalizeToPlot(positions, plot, 64);
  }

  function hierarchical(nodes, edges, plot, meta) {
    const rankdir = meta?.rankdir || 'LR';
    const preferTypes = meta?.edgeTypes || ['国库支付', '开发票', '企业核心人员', '法人股东', '财政供养'];
    const filtered = edges.filter((e) => preferTypes.includes(e.type));
    const useEdges = filtered.length >= Math.max(1, nodes.length * 0.18) ? filtered : edges;
    const hasExplicitLayer = nodes.some((n) => Number.isFinite(Number(n.layer)));
    const depth = new Map();
    if (hasExplicitLayer) {
      nodes.forEach((n) => depth.set(n.id, Math.max(0, Number(n.layer) || 0)));
    } else {
      const inDeg = new Map(nodes.map((n) => [n.id, 0]));
      useEdges.forEach((e) => {
        inDeg.set(e.to, (inDeg.get(e.to) || 0) + 1);
      });
      const roots = nodes.filter((n) => (inDeg.get(n.id) || 0) === 0).map((n) => n.id);
      const start = meta?.treeRootId && nodes.some((n) => n.id === meta.treeRootId)
        ? meta.treeRootId
        : roots[0] || nodes[0]?.id;
      const adj = buildAdjacency(nodes, useEdges, false);
      bfsLayers(adj, start, null).forEach((d, id) => depth.set(id, d));
      nodes.forEach((n) => {
        if (!depth.has(n.id)) depth.set(n.id, 1);
      });
    }

    const sorted = sortByScore(nodes, edges).map((n) => n.id);
    const rankMap = new Map(sorted.map((id, i) => [id, i]));
    const layers = groupByLayer(depth);
    const maxLayer = Math.max(...depth.values(), 1);
    const positions = new Map();

    [...layers.entries()].forEach(([layer, ids]) => {
      ids.sort((a, b) => (rankMap.get(a) || 0) - (rankMap.get(b) || 0));
      const span = rankdir === 'TB' ? plot.plotWidth : plot.plotHeight;
      const maxPerLane = Math.max(6, Math.floor(span / 72));
      const laneCount = Math.max(1, Math.ceil(ids.length / maxPerLane));
      const rowCount = Math.ceil(ids.length / laneCount);
      const axisStep = Math.max(64, span / (rowCount + 1));
      const layerStep = (rankdir === 'TB' ? plot.plotHeight : plot.plotWidth) / (maxLayer + 1);
      const laneGap = Math.min(58, layerStep / Math.max(laneCount + 1, 2));
      ids.forEach((id, i) => {
        const lane = i % laneCount;
        const row = Math.floor(i / laneCount);
        const laneOffset = (lane - (laneCount - 1) / 2) * laneGap;
        if (rankdir === 'TB') {
          positions.set(id, {
            x: plot.padX + axisStep * (row + 1),
            y: plot.padY + layerStep * (layer + 0.55) + laneOffset,
          });
        } else {
          positions.set(id, {
            x: plot.padX + layerStep * (layer + 0.55) + laneOffset,
            y: plot.padY + axisStep * (row + 1),
          });
        }
      });
    });
    return finalizePositions(positions, nodes, plot, 48, { iterations: 10, padding: 10 });
  }

  function concentric(nodes, edges, plot, meta) {
    const cx = plot.padX + plot.plotWidth / 2;
    const cy = plot.padY + plot.plotHeight / 2;
    const degrees = degreeMap(nodes, edges);
    const thresholds = meta?.thresholds || [80, 60, 40];
    const rings = [[], [], [], []];
    sortByScore(nodes, edges).forEach((node) => {
      const score = scoreNode(node, degrees);
      const idx = score >= thresholds[0] ? 0 : score >= thresholds[1] ? 1 : score >= thresholds[2] ? 2 : 3;
      rings[idx].push(node.id);
    });
    const positions = new Map();
    let radius = 0;
    rings.forEach((ids, idx) => {
      if (!ids.length) return;
      if (idx === 0 && ids.length === 1) {
        positions.set(ids[0], { x: cx, y: cy });
        radius = 56;
        return;
      }
      const minArc = estimateMinArcPx(nodes, ids, 88);
      radius = Math.max(radius + 94, ringRadiusForCount(ids.length, idx === 0 ? 66 : radius, minArc));
      placeOnRing(ids, cx, cy, radius, -Math.PI / 2, minArc).forEach((p, id) => positions.set(id, p));
    });
    return finalizePositions(positions, nodes, plot, 56, { iterations: 8, padding: 10 });
  }

  function circular(nodes, edges, plot, meta) {
    const cx = plot.padX + plot.plotWidth / 2;
    const cy = plot.padY + plot.plotHeight / 2;
    const preferredIds = meta?.loopOrder || meta?.circularNodeIds || meta?.pathNodeIds || [];
    const preferred = preferredIds.filter((id) => nodes.some((n) => n.id === id));
    const main = preferred.length >= 3 ? preferred : nodes.map((n) => n.id).slice(0, Math.min(nodes.length, 14));
    const mainSet = new Set(main);
    const minArc = estimateMinArcPx(nodes, main, 96);
    const radius = ringRadiusForCount(main.length, Math.min(plot.plotWidth, plot.plotHeight) * 0.34, minArc);
    const positions = placeOnRing(main, cx, cy, radius, -Math.PI / 2, minArc);
    const mainAngles = new Map();
    main.forEach((id) => {
      const p = positions.get(id);
      mainAngles.set(id, Math.atan2(p.y - cy, p.x - cx));
    });

    const attachments = new Map(main.map((id) => [id, []]));
    nodes.forEach((node) => {
      if (mainSet.has(node.id)) return;
      const linked = edges.find((e) => (e.from === node.id && mainSet.has(e.to)) || (e.to === node.id && mainSet.has(e.from)));
      const anchor = linked ? (mainSet.has(linked.from) ? linked.from : linked.to) : main[stableHash(node.id) % main.length];
      attachments.get(anchor).push(node.id);
    });

    attachments.forEach((ids, anchor) => {
      const angle = mainAngles.get(anchor) || 0;
      ids.forEach((id, i) => {
        const row = Math.floor(i / 4);
        const col = i % 4;
        const fan = (col - 1.5) * 0.18;
        const r = radius + 76 + row * 44;
        positions.set(id, {
          x: cx + r * Math.cos(angle + fan),
          y: cy + r * Math.sin(angle + fan),
        });
      });
    });
    return normalizeToPlot(positions, plot, 58);
  }

  function grid(nodes, edges, plot) {
    const typeGroups = [...groupBy(nodes, (n) => n.type || '未分类实体').entries()]
      .sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'zh-Hans-CN'));
    const sectionGap = 22;
    const sectionH = (plot.plotHeight - sectionGap * Math.max(0, typeGroups.length - 1)) / Math.max(typeGroups.length, 1);
    const positions = new Map();
    typeGroups.forEach(([, members], gi) => {
      const sorted = [...members].sort((a, b) => {
        const typeSort = String(a.type || '').localeCompare(String(b.type || ''), 'zh-Hans-CN');
        if (typeSort) return typeSort;
        const riskSort = (b.riskScore || 0) - (a.riskScore || 0);
        if (riskSort) return riskSort;
        return String(a.label || a.id).localeCompare(String(b.label || b.id), 'zh-Hans-CN');
      });
      const cols = Math.max(4, Math.ceil(Math.sqrt(sorted.length * (plot.plotWidth / Math.max(sectionH, 1)))));
      const rows = Math.ceil(sorted.length / cols);
      const cellW = plot.plotWidth / Math.max(cols, 1);
      const cellH = sectionH / Math.max(rows, 1);
      sorted.forEach((node, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        positions.set(node.id, {
          x: plot.padX + cellW * col + cellW / 2,
          y: plot.padY + gi * (sectionH + sectionGap) + cellH * row + cellH / 2,
        });
      });
    });
    return finalizePositions(positions, nodes, plot, 36, { iterations: 3, padding: 8, strength: 0.48 });
  }

  function community(nodes, edges, plot) {
    const groups = [...groupBy(nodes, (n) => n.groupId || n.type || '未分组').entries()]
      .sort((a, b) => b[1].length - a[1].length);
    const cx = plot.padX + plot.plotWidth / 2;
    const cy = plot.padY + plot.plotHeight / 2;
    const groupRadius = Math.min(plot.plotWidth, plot.plotHeight) * 0.31;
    const positions = new Map();
    groups.forEach(([group, members], gi) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * gi) / Math.max(groups.length, 1);
      const gx = groups.length === 1 ? cx : cx + groupRadius * Math.cos(angle);
      const gy = groups.length === 1 ? cy : cy + groupRadius * Math.sin(angle);
      const ids = sortByScore(members, edges).map((n) => n.id);
      const innerRadius = Math.max(42, Math.sqrt(members.length) * 18);
      if (ids.length === 1) {
        positions.set(ids[0], { x: gx, y: gy });
        return;
      }
      placeOnRing(ids, gx, gy, innerRadius, (stableHash(group) % 360) * Math.PI / 180, 72)
        .forEach((p, id) => positions.set(id, p));
    });
    const groupCenterById = new Map();
    groups.forEach(([group, members], gi) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * gi) / Math.max(groups.length, 1);
      const center = {
        x: groups.length === 1 ? cx : cx + groupRadius * Math.cos(angle),
        y: groups.length === 1 ? cy : cy + groupRadius * Math.sin(angle),
      };
      members.forEach((n) => groupCenterById.set(n.id, center));
    });
    nodes.forEach((node) => {
      const linkedCenters = [];
      edges.forEach((edge) => {
        if (edge.from === node.id && groupCenterById.has(edge.to)) linkedCenters.push(groupCenterById.get(edge.to));
        if (edge.to === node.id && groupCenterById.has(edge.from)) linkedCenters.push(groupCenterById.get(edge.from));
      });
      if (linkedCenters.length < 2) return;
      const avg = linkedCenters.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
      const p = positions.get(node.id);
      if (!p) return;
      p.x = (p.x + avg.x / linkedCenters.length) / 2;
      p.y = (p.y + avg.y / linkedCenters.length) / 2;
    });
    return finalizePositions(positions, nodes, plot, 62, { iterations: 12, padding: 10 });
  }

  function path(nodes, plot, pathNodeIds) {
    const ids = (pathNodeIds || []).filter((id) => nodes.some((n) => n.id === id));
    if (!ids.length) return circular(nodes, plot, {});
    const positions = new Map();
    const lookup = nodeById(nodes);
    let maxLen = 4;
    ids.forEach((id) => {
      maxLen = Math.max(maxLen, String(lookup.get(id)?.label || '').length);
    });
    const step = Math.max(maxLen * 9, 112, plot.plotWidth / (ids.length + 1));
    const y = plot.padY + plot.plotHeight / 2;
    ids.forEach((id, i) => {
      positions.set(id, { x: plot.padX + step * (i + 1), y });
    });
    const orphans = nodes.filter((n) => !positions.has(n.id)).map((n) => n.id);
    placeOrphanGrid(orphans, plot).forEach((p, id) => positions.set(id, p));
    return finalizePositions(positions, nodes, plot, 48, { iterations: 3, padding: 10 });
  }

  function compute(mode, nodes, edges, plot, meta) {
    const layoutMeta = meta?.layoutMeta || {};
    const mergedMeta = { ...layoutMeta, ...meta };
    const centerId = mergedMeta.centerNodeId;
    const pathNodeIds = mergedMeta.pathNodeIds;
    const treeRootId = mergedMeta.treeRootId;

    switch (mode) {
      case 'force':
        return force(nodes, edges, plot, mergedMeta);
      case 'radial':
        return radial(nodes, edges, plot, centerId, mergedMeta);
      case 'hierarchical':
        return hierarchical(nodes, edges, plot, { ...mergedMeta, treeRootId });
      case 'concentric':
        return concentric(nodes, edges, plot, mergedMeta);
      case 'circular':
        return circular(nodes, edges, plot, { ...mergedMeta, pathNodeIds });
      case 'grid':
        return grid(nodes, edges, plot);
      case 'community':
        return community(nodes, edges, plot);
      case 'tree':
        return hierarchical(nodes, edges, plot, { ...mergedMeta, rankdir: 'TB', treeRootId });
      case 'path':
        return path(nodes, plot, pathNodeIds);
      case 'preset':
      default: {
        const map = new Map();
        const hasAll = nodes.every((n) => typeof n.cx === 'number' && typeof n.cy === 'number');
        if (hasAll) {
          nodes.forEach((n) => {
            map.set(n.id, {
              x: plot.padX + (n.cx / 640) * plot.plotWidth,
              y: plot.padY + (n.cy / 430) * plot.plotHeight,
            });
          });
          return map;
        }
        return radial(nodes, edges, plot, centerId, mergedMeta);
      }
    }
  }

  const LAYOUT_MODES = [
    { value: 'force', label: '关系探索', desc: '用确定性力导向形成自然团簇，适合复杂关系总览', scenario: '复杂关系探索', visualGoal: '看出多主体网络中的自然团簇与跨团簇桥接线索', recommendedHistoryId: 'h-audit-100' },
    { value: 'radial', label: '中心穿透', desc: '以重点主体为中心，按关系跳数分层展开', scenario: '重点对象穿透', visualGoal: '看出中心主体的 1-4 跳穿透圈层', recommendedHistoryId: 'h-a-03' },
    { value: 'hierarchical', label: '链路分层', desc: '按有向关系分层，突出国库支付、开票和人员链路', scenario: '支付 / 开票 / 人员链路', visualGoal: '看出从行政事业单位到企业、人员和外部线索的左到右方向', recommendedHistoryId: 'h-a-04' },
    { value: 'concentric', label: '风险分层', desc: '按风险分、重要性或度数分圈，高风险对象靠近中心', scenario: '风险总览', visualGoal: '看出高风险对象集中在内圈，低风险对象在外圈', recommendedHistoryId: 'h-a-06' },
    { value: 'circular', label: '环形闭环', desc: '将闭环主节点排成环，外侧挂载电话、车辆和人员线索', scenario: '支付与开票闭环', visualGoal: '看出一条可追踪的支付、开票和人员关系闭合路径', recommendedHistoryId: 'h-a-14' },
    { value: 'grid', label: '网格浏览', desc: '按类型和风险排序平铺对象，适合批量结果规整浏览', scenario: '查询结果浏览', visualGoal: '像名单表一样扫描批量对象，关系线只作辅助', recommendedHistoryId: 'h-a-10' },
    { value: 'community', label: '社区聚类', desc: '按团簇字段聚合成多个关系群，适合围标和圈层识别', scenario: '团伙关系与大图聚类', visualGoal: '看出多个关系社区和跨社区桥接线索', recommendedHistoryId: 'h-p-02' },
  ];

  window.DGP_GRAPH_LAYOUT = {
    LAYOUT_MODES,
    compute,
    force,
    radial,
    hierarchical,
    concentric,
    circular,
    grid,
    community,
    path,
  };
})();
