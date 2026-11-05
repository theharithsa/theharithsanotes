/** @typedef {{type?:string,revision?:string,percent?:number,tag?:string}} TrafficTarget */
/** Preserve pinned Hosting URLs while promoting the new revision to all ordinary traffic.
 * @param {TrafficTarget[]} current
 * @returns {TrafficTarget[]}
 */
export function trafficForRelease(current = []) {
  const pinned = current
    .filter((target) => target.tag)
    .map((target) => {
      if (
        ![
          "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST",
          "TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION",
        ].includes(target.type ?? "") ||
        (target.type === "TRAFFIC_TARGET_ALLOCATION_TYPE_REVISION" &&
          !target.revision)
      )
        throw Error("Cannot safely preserve an unresolved Cloud Run tag");
      return {
        type: target.type,
        ...(target.revision ? { revision: target.revision } : {}),
        tag: target.tag,
        percent: 0,
      };
    });
  return [
    { type: "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST", percent: 100 },
    ...pinned,
  ];
}
