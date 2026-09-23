/**
 * P22OSINT 太阳阴影测绘与寻址推算仪
 * 基于 SunCalc 真实天文运算
 */

const dtInput = document.getElementById("dt");
const latInput = document.getElementById("lat");
const lngInput = document.getElementById("lng");
const obsInput = document.getElementById("obsShadow");
const tzInput = document.getElementById("tzOffset");
const btnCalc = document.getElementById("btnCalc");
const btnLoadCase = document.getElementById("btnLoadCase");
const caseStudyPanel = document.getElementById("caseStudy");

// Result Elements
const resSunAz = document.getElementById("resSunAz");
const resSunAlt = document.getElementById("resSunAlt");
const resShadowAz = document.getElementById("resShadowAz");
const validationResult = document.getElementById("validationResult");
const valMessage = document.getElementById("valMessage");

// Compass Needles
const pinSun = document.getElementById("pinSun");
const pinShadow = document.getElementById("pinShadow");
const pinObserved = document.getElementById("pinObserved");

// Initialize with current time removing seconds to fit datetime-local
const now = new Date();
now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
dtInput.value = now.toISOString().slice(0, 16);

let tzTouched = false;
for (let offset = -12; offset <= 14; offset += 1) {
  const option = document.createElement("option");
  option.value = String(offset);
  option.textContent = `UTC${offset >= 0 ? "+" : ""}${offset}`;
  tzInput.appendChild(option);
}
function suggestOffset(lng) {
  if (!Number.isFinite(lng)) return 8;
  return Math.max(-12, Math.min(14, Math.round(lng / 15)));
}
function syncTimezone() {
  if (tzTouched) return;
  tzInput.value = String(suggestOffset(parseFloat(lngInput.value)));
}
tzInput.addEventListener("change", () => {
  tzTouched = true;
});
lngInput.addEventListener("change", syncTimezone);
syncTimezone();

function dateAtOffset(dtVal, offsetHours) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(dtVal);
  if (!match) return new Date(NaN);
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]) - offsetHours, Number(match[5])));
}

// Transform azimuth (0-360 starting from South) to CSS rotation degrees (Starting from North = 0)
// The needle div is drawn downwards from the center.
// So if we rotate 0, it points South. To make it point North, we add 180.
// SunCalc Azimuth: 0 is South, Math.PI/2 is West.
function setNeedleAngle(element, azimuthDegrees) {
  element.classList.remove("hidden");
  // SunCalc azimuth is relative to South. We must adjust to map standard where North is 0.
  // We want to rotate the needle container which has transform-origin at top center.
  // A rotation of 180 deg makes it point strictly UP (North in CSS layout).
  const cssRot = (azimuthDegrees + 180) % 360;
  element.style.transform = `translateX(-50%) rotate(${cssRot}deg)`;
}

btnCalc.addEventListener("click", () => {
  const dtVal = dtInput.value;
  const lat = parseFloat(latInput.value);
  const lng = parseFloat(lngInput.value);

  if (!dtVal || isNaN(lat) || isNaN(lng)) {
    validationResult.classList.remove("hidden");
    validationResult.classList.add("fail");
    valMessage.textContent = "错误：请正确填写日期时间和经纬度。";
    return;
  }

  const dateObj = dateAtOffset(dtVal, Number(tzInput.value));
  if (Number.isNaN(dateObj.getTime())) {
    validationResult.classList.remove("hidden");
    validationResult.classList.add("fail");
    valMessage.textContent = "时间格式无法解析。请重新选择拍摄时间。";
    return;
  }

  // Call SunCalc library (expected in global scope)
  // SunCalc.getPosition returns azimuth in radians (0 = south, pointing west) and altitude in radians.
  // In typical navigation: 0 = North, 90 = East.
  // SunCalc to Navigation: (SunCalc_Azimuth_Rad * 180 / PI) + 180 (modulo 360)
  const pos = SunCalc.getPosition(dateObj, lat, lng);

  let sunAzimuthNav = (pos.azimuth * 180 / Math.PI + 180) % 360;
  let sunAltitude = pos.altitude * 180 / Math.PI;

  // Shadow points exactly opposite to the sun
  let shadowAzimuthNav = (sunAzimuthNav + 180) % 360;

  // Render text results
  resSunAz.textContent = sunAzimuthNav.toFixed(1) + "°";
  resSunAlt.textContent = sunAltitude.toFixed(1) + "°";
  resShadowAz.textContent = shadowAzimuthNav.toFixed(1) + "°";

  // Hide needles originally
  pinSun.classList.add('hidden');
  pinShadow.classList.add('hidden');
  pinObserved.classList.add('hidden');

  if (sunAltitude < 0) {
    resSunAlt.textContent += " (太阳已落山)";
    resShadowAz.textContent = "无阴影";
    validationResult.classList.remove("hidden");
    validationResult.classList.add("fail");
    valMessage.textContent = "按这个时间和地点，太阳在地平线以下，平地不该有阳光阴影。若画面里有清晰日影，时间和地点至少有一项对不上，需要复核时区、日期和测量。";
    return;
  }

  // Draw needles
  setNeedleAngle(pinSun, sunAzimuthNav);
  setNeedleAngle(pinShadow, shadowAzimuthNav);

  // Validation if user inputted observed shadow
  const obsValStr = obsInput.value.trim();
  if (obsValStr !== "") {
    const obsAzimuth = parseFloat(obsValStr);
    if (!Number.isFinite(obsAzimuth) || obsAzimuth < 0 || obsAzimuth > 360) {
      validationResult.classList.remove("hidden");
      validationResult.classList.add("fail");
      valMessage.textContent = "阴影方位角要填 0 到 360 之间的数字。";
      return;
    }
    setNeedleAngle(pinObserved, obsAzimuth);

    // Check difference
    let diff = Math.abs(shadowAzimuthNav - obsAzimuth);
    if (diff > 180) diff = 360 - diff;

    validationResult.classList.remove("hidden");
    if (diff <= 15) {
      validationResult.classList.remove("fail");
      valMessage.textContent = `阴影方向和理论值相差 ${diff.toFixed(1)}°，落在 ±15° 以内。这只说明方向上说得通。人工测角、镜头和地面坡度都可能带来这个量级的误差。`;
    } else {
      validationResult.classList.add("fail");
      valMessage.textContent = `阴影方向和理论值相差 ${diff.toFixed(1)}°，超出 ±15°。这是需要复核的线索，不是造假判定。`;
    }
  } else {
    validationResult.classList.add("hidden");
  }
});

// Interactive Case Study Loading
btnLoadCase.addEventListener('click', () => {
  caseStudyPanel.classList.toggle('hidden');
});

// Click to copy values from case study to inputs (keyboard accessible)
document.querySelectorAll('.val-copy').forEach(el => {
  el.setAttribute('tabindex', '0');
  const applyVal = () => {
    const rawVal = el.getAttribute('data-val');

    if (rawVal.includes(',')) {
      const [la, lo] = rawVal.split(',');
      latInput.value = la.trim();
      lngInput.value = lo.trim();
      syncTimezone();
    } else if (rawVal.includes('T')) {
      dtInput.value = rawVal;
    } else {
      obsInput.value = rawVal;
    }

    // Highlight effect
    const origBg = el.style.background;
    el.style.background = '#4caf50';
    el.style.color = '#fff';
    setTimeout(() => {
      el.style.background = origBg;
      el.style.color = '';
    }, 500);
  };
  el.addEventListener('click', applyVal);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      applyVal();
    }
  });
});

// === PM Metrics Integration ===
(function () {
  try {
    if (!window.pmMetrics) return;
    let taskStarted = false;
    document.addEventListener('click', function (e) {
      if (taskStarted) return;
      const btn = e.target.closest('button, .val-copy');
      if (btn) {
        taskStarted = true;
        window.pmMetrics.markTaskStart('osint_shadow_task');
      }
    }, { once: false });
  } catch (_e) { }
})();
