import"./modulepreload-polyfill-P2Xu9kJm.js";var e=`https://gamification-ds.onrender.com`,t=localStorage.getItem(`accessToken`);t||(window.location.href=`/`);async function n(r,i={}){let a=await fetch(e+r,{...i,headers:{Authorization:`Bearer `+t,"Content-Type":`application/json`,...i.headers}});if(a.status===401){let a=await fetch(e+`/api/auth/refresh`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({refreshToken:localStorage.getItem(`refreshToken`)})});if(a.ok){let e=await a.json();return t=e.accessToken,localStorage.setItem(`accessToken`,e.accessToken),localStorage.setItem(`refreshToken`,e.refreshToken),n(r,i)}window.location.href=`/`;return}return a.json()}function r(e){document.getElementById(`avatar`).src=e.avatarUrl||``,document.getElementById(`name`).textContent=e.name||e.email,document.getElementById(`content`).innerHTML=`
                <div class="card">
                    <h2>Profile</h2>
                    <div class="field"><span class="field-label">Name</span><span class="field-value">${e.name||`-`}</span></div>
                    <div class="field"><span class="field-label">Email</span><span class="field-value">${e.email}</span></div>
                    <div class="field"><span class="field-label">City</span><span class="field-value">${e.emplannerCity||`-`}, ${e.emplannerCountry||`-`}</span></div>
                    <div class="field"><span class="field-label">Contract</span><span class="field-value">${e.extraId||`-`}</span></div>
                    <div class="field"><span class="field-label">Slack</span><span class="field-value">${e.slackId||`-`}</span></div>
                </div>

                <div class="card">
                    <h2>Roles</h2>
                    <div>${e.roles?.map(e=>`<span class="badge">`+(e.role?.code||e)+`</span>`).join(``)||`<span class="badge">MEMBER</span>`}</div>
                </div>

                <div class="card">
                    <h2>Specializations</h2>
                    <div>${e.specializations?.map(e=>`<span class="badge badge-green">`+(e.specialization?.code||e)+`</span>`).join(``)||`<span style="color:#555">None assigned</span>`}</div>
                </div>

                <div class="card">
                    <h2>Emplanner Teams</h2>
                    <div style="margin-bottom:8px;color:#888;font-size:13px">Member:</div>
                    <div class="teams">${(e.emplannerTeams?.member||[]).map(e=>`<span class="badge">`+e.name+`</span>`).join(``)||`<span style="color:#555">-</span>`}</div>
                    <div style="margin:12px 0 8px;color:#888;font-size:13px">Leader:</div>
                    <div class="teams">${(e.emplannerTeams?.leader||[]).map(e=>`<span class="badge badge-green">`+e.name+`</span>`).join(``)||`<span style="color:#555">-</span>`}</div>
                </div>

                <div class="card">
                    <h2>Emplanner Info</h2>
                    <div class="field"><span class="field-label">Roles</span><span class="field-value">${(e.emplannerRoles||[]).join(`, `)||`-`}</span></div>
                    <div class="field"><span class="field-label">Tags</span><span class="field-value">${(e.emplannerTags||[]).join(`, `)||`-`}</span></div>
                    <div class="field"><span class="field-label">UTC</span><span class="field-value">${e.emplannerUtc??`-`}</span></div>
                    <div class="field"><span class="field-label">Feedback</span><span class="field-value">${e.emplannerFeedbackUrl?`<a href="`+e.emplannerFeedbackUrl+`" target="_blank" style="color:#7c7cff">Open</a>`:`-`}</span></div>
                </div>
            `}async function i(){try{let e=await n(`/api/users/me`);if(e.error)throw Error(e.error);r(e)}catch(e){document.getElementById(`content`).innerHTML=`<div class="error">`+e.message+`</div>`}}window.logout=function(){localStorage.removeItem(`accessToken`),localStorage.removeItem(`refreshToken`),window.location.href=`/`},i();