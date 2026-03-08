/**
 * P22OSINT 太阳阴影测绘与寻址推算仪
 * 基于 SunCalc 真实天文运算
 */

const dtInput = document.getElementById("dt");
const latInput = document.getElementById("lat");
const lngInput = document.getElementById("lng");
const obsInput = document.getElementById("obsShadow");
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
    alert("请正确填写日期时间和经纬度。");
    return;
  }

  // Parse local time
  const dateObj = new Date(dtVal);

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
    valMessage.textContent = "该时间地点处于黑夜，不可能产生阳光阴影！如果照片有阳光，则说明由于时差或编造，时间和地点并不匹配。";
    return;
  }

  // Draw needles
  setNeedleAngle(pinSun, sunAzimuthNav);
  setNeedleAngle(pinShadow, shadowAzimuthNav);

  // Validation if user inputted observed shadow
  const obsValStr = obsInput.value.trim();
  if (obsValStr !== "") {
    const obsAzimuth = parseFloat(obsValStr);
    setNeedleAngle(pinObserved, obsAzimuth);

    // Check difference
    let diff = Math.abs(shadowAzimuthNav - obsAzimuth);
    if (diff > 180) diff = 360 - diff;

    validationResult.classList.remove("hidden");
    if (diff <= 15) {
      validationResult.classList.remove("fail");
      valMessage.textContent = `✅ 验证通过。观察到的阴影(${obsAzimuth}°)与理论极度吻合(偏差 ${diff.toFixed(1)}°)。该视频发生在此时间和地点具有天文学可行性。`;
    } else {
      validationResult.classList.add("fail");
      valMessage.textContent = `❌ 验证失败！观察阴影(${obsAzimuth}°)与在此坐标此时此刻应该出现的物理阴影(${shadowAzimuthNav.toFixed(1)}°)存在巨大偏差(${diff.toFixed(1)}°)。判定：素材系被盗用、篡改或时间地点造假。`;
    }
  } else {
    validationResult.classList.add("hidden");
  }
});

// Interactive Case Study Loading
btnLoadCase.addEventListener('click', () => {
  caseStudyPanel.classList.toggle('hidden');
});

// Click to copy values from case study to inputs
document.querySelectorAll('.val-copy').forEach(el => {
  el.addEventListener('click', (e) => {
    const rawVal = e.target.getAttribute('data-val');

    if (rawVal.includes(',')) {
      const [la, lo] = rawVal.split(',');
      latInput.value = la.trim();
      lngInput.value = lo.trim();
    } else if (rawVal.includes('T')) {
      dtInput.value = rawVal;
    } else {
      obsInput.value = rawVal;
    }

    // Highlight effect
    const origBg = e.target.style.background;
    e.target.style.background = '#4caf50';
    e.target.style.color = '#fff';
    setTimeout(() => {
      e.target.style.background = origBg;
      e.target.style.color = '';
    }, 500);
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
