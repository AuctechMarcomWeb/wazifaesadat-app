import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  useWindowDimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNPrint from 'react-native-print';
import colors from '../../themes/colors';
import { FontFamily, FontSize } from '../../themes/typography';
import { getMyScholarshipForm } from '../../api/scholarship';
import BackHeader from '../../components/BackHeader/BackHeader';
import AppLayout from '../../components/AppLayout/AppLayout';
import HEADER_IMAGE from './headerImage';

// ================================================================
// CONFIG
// ================================================================
// true karne par Aadhaar aur Bank A/C number masked dikhenge
const MASK_SENSITIVE = false;

const SHEET_WIDTH = 763; // A4 design width (PDF jaisa)
const ZOOM_SCALE = 1.3;

const DOCUMENTS = [
  'Aadhaar Card Copy',
  'Active Bank Passbook Copy with Updated KYC',
  'Latest Fee Receipt / School or College Fee Slip',
  'Previous Class Marksheet / Result Copy',
  'Passport Size Photograph',
  '(Orphan [Yateem] Students are requested to submit death certificate of his/her Father)',
  'Student ID Card / Bonafide Certificate (if available)',
];

const DECLARATION_1 =
  'I also declare & Promise as to my moral & social obligation to help needy & promising students by refunding/paying the total amount of Wazifa received by me immediately on getting any employment or starting to earn';

const DECLARATION_2 = [
  'I, hereby declare that all the information given above are true and correct. If any information is found to be false or incorrect at any stage, application will be at once ',
  'REJECTED',
  ' & the Wazifa will be discontinued, the beneficiary will have to refund the entire amount received.',
];

// ================================================================
// HELPERS
// ================================================================
const text = value =>
  value === undefined || value === null ? '' : String(value);

const formatDate = value => {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
};

const mask = value => {
  const v = text(value);
  return MASK_SENSITIVE && v.length > 4 ? `XXXXXX${v.slice(-4)}` : v;
};

const escapeHtml = value =>
  text(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Screen aur PDF dono isi data se bante hain
const getFormValues = (d = {}) => {
  const type = text(d.formType).toLowerCase();
  const isRenewal = type === 'tajdeed' || type === 'renewal';
  const course =
    typeof d.courseOfStudy === 'object'
      ? text(d.courseOfStudy?.name)
      : text(d.courseOfStudy);
  const wazifaNo = text(d.wazifaNo || d.applicationNo);
  const dob = formatDate(d.dateOfBirth);

  return {
    isRenewal,
    course,
    wazifaNo,
    dob,
    session: text(d.courseOfStudy?.session || d.session || '2026-2027'),
    applicationNo: text(d.applicationNo),
    date: formatDate(d.dateOfApplication || d.createdAt),
    photo: d.photo || d.studentPhoto || '',

    // [label, value] ya [label, value, label, value]
    studentRows: [
      ['Name of the Student', d.studentName],
      ['Date of Birth', dob, 'Present Class', d.presentClass],
      ['Course of Study', course, 'Duration of Course', d.courseDuration],
      ['Semester', d.semester, 'Admission Fees (Rs)', d.admissionFees],
      [
        'Total Annual Fees (Rs)',
        d.totalAnnualFees,
        'Institution Name & Address',
        d.institutionName,
      ],
      [
        "Father's Name",
        d.fatherName,
        'Father/Guardian Annual Income (Rs)',
        d.fatherIncome,
      ],
      [
        "Mother's Name",
        d.motherName,
        "Mother's Annual Income (Rs)",
        d.motherIncome,
      ],
      [
        'Guardian Name',
        d.guardianName,
        'Guardian Relationship',
        d.guardianRelationship,
      ],
      ['Permanent Address', d.permanentAddress],
      ['Pin Code', d.pinCode, 'Aadhaar No.', mask(d.aadhaarNo)],
      ['Present Address', d.presentAddress],
      ['Contact No.', d.contactNo, 'Email', d.email],
      ['Bank A/C Name', d.bankAcName, 'Bank A/C No.', mask(d.bankAcNo)],
      ['IFSC', d.ifsc, 'Bank Name, Branch & City', d.bankDetails],
    ],

    // har cell: [label, value, width %]
    recommendations: [
      {
        title: 'Recommendation by any Member of the Anjuman WSWM',
        rows: [
          [
            ['Name of Member', d.memberName, 32],
            ['Membership No:', d.membershipNo, 29.5],
            ['Mobile No:', d.memberMobile, 38.5],
          ],
          [
            ['Address:', d.memberAddress, 61.5],
            ['Signature of Member:', '', 38.5],
          ],
        ],
      },
      {
        title: 'Recommendation by "Aalim-e-Deen" or Reputed Person',
        rows: [
          [
            ['Name of Member:', d.aalimName, 32],
            ['Mobile No:', d.aalimMobile, 29.5],
            ['Pin Code:', d.aalimPinCode, 38.5],
          ],
          [
            ['Address:', d.aalimAddress, 61.5],
            ['Signature of Member:', '', 38.5],
          ],
        ],
      },
      {
        title:
          'Recommendation by the Local Secretary of the Anjuman WSWMomineen',
        rows: [
          [
            ['Name of Local Secretary:', d.localSecretaryName, 61.5],
            ['Mobile No:', d.localSecretaryMobile, 38.5],
          ],
          [
            ['City / Area:', d.localSecretaryCity, 61.5],
            ['Signature:', '', 38.5],
          ],
        ],
      },
    ],
  };
};

// ================================================================
// PDF HTML
// ================================================================
const buildHtml = d => {
  const v = getFormValues(d);
  const e = escapeHtml;
  const photo = v.photo ? `<img src="${e(v.photo)}" />` : 'Photo';

  const studentRows = v.studentRows
    .map(([l1, v1, l2, v2]) =>
      l2
        ? `<tr><td class="l">${e(l1)}</td><td>${e(v1)}</td><td class="l">${e(
            l2,
          )}</td><td>${e(v2)}</td></tr>`
        : `<tr><td class="l">${e(l1)}</td><td colspan="3">${e(v1)}</td></tr>`,
    )
    .join('');

  const recommendations = v.recommendations
    .map(
      section => `
      <div class="rec-title">${e(
        section.title,
      )} <span>(Not to be filled by student)</span></div>
      ${section.rows
        .map(
          row =>
            `<div class="rec-row">${row
              .map(
                ([label, value, width]) =>
                  `<div style="width:${width}%"><b>${e(label)}</b> ${e(
                    value,
                  )}</div>`,
              )
              .join('')}</div>`,
        )
        .join('')}`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;700&display=swap" rel="stylesheet" />
<style>
  @page { size: A4; margin: 4mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; font-family: 'Work Sans', Arial, sans-serif; color: #000; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  td { border: 1px solid #000; padding: 0 3px; word-wrap: break-word; }
  .page { padding-top: 6px; }
  .sheet { border: 1px solid #99a1af; }
  .center { text-align: center; border-bottom: 1px solid #99a1af; }
  .header img { display: block; width: 289px; height: 53px; margin: 0 auto; }
  .session { font-size: 7.8px; padding: 3px 0 5px; line-height: 17px; }
  .session div + div { color: #6a7282; }
  .formno { padding: 7px 0; font-size: 7.8px; font-weight: 700; }
  .mark { background: #e5e7eb; padding: 1px 2px; }
  .warn { font-size: 11.5px; line-height: 20px; padding: 1px 4px 3px; }
  .orphan { font-size: 7.8px; padding: 7px 0; }

  .top td { font-size: 7.4px; font-weight: 700; height: 13px; line-height: 11px; background: #f0f0f0; }
  .top td.c { text-align: center; }
  .top td.w { background: #fff; }
  .top td.photo-cell { background: #fff; padding: 2px; vertical-align: top; }
  .photo { margin-left: auto; width: 110px; height: 130px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 400; color: #888; overflow: hidden; }
  .photo img, .slip-photo img { width: 100%; height: 100%; object-fit: cover; }

  .data td { font-size: 7.4px; height: 13px; line-height: 11px; }
  .data td.l { background: #f0f0f0; font-weight: 700; }
  .data td.bar { background: #e0e0e0; font-weight: 700; text-align: center; }

  .rec-title { background: #e0e0e0; border: 1px solid #000; border-bottom: 0; text-align: center; font-size: 7.4px; font-weight: 700; line-height: 13px; }
  .rec-title span { color: #f00; font-size: 10px; }
  .rec-row { display: flex; border: 1px solid #000; border-bottom: 0; background: #f0f0f0; }
  .rec-row div { font-size: 7.4px; line-height: 11px; min-height: 12px; padding: 0 3px; border-right: 1px solid #000; }
  .rec-row div:last-child { border-right: 0; }

  .decl { border-top: 1px solid #000; padding: 4px 4px 0; }
  .decl-row { display: flex; font-size: 11.5px; line-height: 22px; margin-bottom: 9px; }
  .check { flex: none; width: 13px; height: 13px; margin: 4px 7px 0 0; border-radius: 2px; background: #0b6fd8; color: #fff; font-size: 11px; line-height: 13px; text-align: center; }
  .signs { display: flex; justify-content: space-between; padding: 0 2px 4px; font-size: 11.5px; }
  .signs div { width: 180px; height: 62px; border-bottom: 1px solid #000; }

  .page2 { page-break-before: always; }
  .note { background: #fefce8; border-left: 4px solid #fcc800; padding: 18px 16px 12px; font-size: 11.5px; color: #1e2939; }
  .note p { margin: 0 0 12px; }
  .note ul { margin: 0; padding-left: 20px; line-height: 24px; }
  .slip-title { text-align: center; margin: 6px 0; font-size: 14px; font-weight: 700; }
  .slip-title small { font-size: 10px; }
  .slip-sub { text-align: center; font-size: 11.5px; margin-bottom: 11px; }
  .slip td { font-size: 7.4px; height: 13px; line-height: 11px; }
  .slip tr.tall td { height: 34px; }
  .slip tr.sign td { height: 70px; }
  .slip td.slip-photo-cell { padding: 2px; text-align: center; }
  .slip-photo { height: 129px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #888; overflow: hidden; }
</style>
</head>
<body>
  <div class="page">
    <div class="sheet">
      <div class="center header"><img src="${HEADER_IMAGE}" /></div>
      <div class="center session">
        <div>Higher Education Scholarship Application Form is valid for session ${e(
          v.session,
        )}</div>
        <div>(Submission of this application does not guarantee for approval of the Scholarship)</div>
      </div>
      <div class="center formno"><span class="mark">FORM NO: ${e(
        v.applicationNo,
      )}</span></div>
      <div class="center warn">Application without proof of admission i.e. (Fee Receipt or Bonafide certificate &amp; Last Examination passed mark sheet will be <b>SUMMARILY REJECTED</b>)</div>
      <div class="center orphan"><span class="mark">(Orphan [Yateem] Students are requested to submit death certificate of his/her Father)</span></div>

      <table class="top">
        <colgroup><col style="width:38.2%"/><col style="width:5.3%"/><col style="width:18.3%"/><col style="width:21.1%"/><col style="width:17.1%"/></colgroup>
        <tr>
          <td class="c" style="height:82px">JADEED - New Application</td>
          <td class="c w">${v.isRenewal ? '' : '✔'}</td>
          <td class="c" rowspan="2">✓Tick any one</td>
          <td class="c">Wazifa Number</td>
          <td class="photo-cell" rowspan="5"><div class="photo">${photo}</div></td>
        </tr>
        <tr>
          <td class="c">TAJDEED - Appln. For RENEWAL</td>
          <td class="c w">${v.isRenewal ? '✔' : ''}</td>
          <td class="c w">${e(v.wazifaNo)}</td>
        </tr>
        <tr><td colspan="3">For Official Use:</td><td>Date: ${e(
          v.date,
        )}</td></tr>
        <tr><td colspan="4">Screening Committee Remarks: ${e(
          d.remarks,
        )}</td></tr>
        <tr><td colspan="3">Member's Name of Screening Committee: ${e(
          d.screeningMember,
        )}</td><td>Signature:</td></tr>
      </table>

      <table class="data">
        <colgroup><col style="width:15.3%"/><col style="width:22.3%"/><col style="width:24.6%"/><col style="width:37.8%"/></colgroup>
        <tr><td class="bar" colspan="4">STUDENT APPLICATION FORM</td></tr>
        ${studentRows}
      </table>

      ${recommendations}

      <div class="decl">
        <div class="decl-row"><span class="check">✓</span><span>${e(
          DECLARATION_1,
        )}</span></div>
        <div class="decl-row"><span class="check">✓</span><span>${e(
          DECLARATION_2[0],
        )}<b>${DECLARATION_2[1]}</b>${e(DECLARATION_2[2])}</span></div>
        <div class="signs">
          <div>Signature of Parent/Guardian:</div>
          <div>Signature of Student:</div>
        </div>
      </div>
    </div>
  </div>

  <div class="page page2">
    <div class="note">
      <p>NOTE: Students are advised to keep a photocopy of the filled-in application form for future record.</p>
      <p>Please ensure that the following documents are enclosed:</p>
      <ul>${DOCUMENTS.map(item => `<li>${e(item)}</li>`).join('')}</ul>
    </div>
    <div class="slip-title">IDENTIFICATION SLIP <small>(FOR PAYMENT)</small></div>
    <div class="slip-sub">(Please fill up all Information in Capital Letters)</div>
    <table class="slip">
      <colgroup><col style="width:16.9%"/><col style="width:41.3%"/><col style="width:10.3%"/><col style="width:14.4%"/><col style="width:17.1%"/></colgroup>
      <tr>
        <td colspan="3"><b>Session - ${e(v.session)}</b></td>
        <td colspan="2"><b>Wazifa No (In case of [Tajdeed] Renewal):</b> ${
          v.isRenewal ? e(v.wazifaNo) : ''
        }</td>
      </tr>
      <tr class="tall">
        <td colspan="4"><b>Student's Name:</b> ${e(d.studentName)}</td>
        <td class="slip-photo-cell" rowspan="4"><div class="slip-photo">${photo}</div></td>
      </tr>
      <tr class="tall">
        <td colspan="3"><b>Father Name:</b> ${e(d.fatherName)}</td>
        <td><b>DOB:</b> ${e(v.dob)}</td>
      </tr>
      <tr class="tall">
        <td><b>Class:</b> ${e(d.presentClass)}</td>
        <td><b>Name of Course:</b> ${e(v.course)}</td>
        <td><b>Year:</b> ${e(d.courseDuration)}</td>
        <td><b>Sem:</b> ${e(d.semester)}</td>
      </tr>
      <tr class="tall">
        <td colspan="3"><b>Address:</b> ${e(
          d.presentAddress || d.permanentAddress,
        )}</td>
        <td><b>Pincode:</b> ${e(d.pinCode)}</td>
      </tr>
      <tr><td colspan="5"><b>Name of the Institution/College:</b> ${e(
        d.institutionName,
      )}</td></tr>
      <tr>
        <td colspan="2"><b>Phone No. (Applicant):</b> ${e(d.contactNo)}</td>
        <td colspan="3"><b>Phone No. (Parent/Guardian):</b> ${e(
          d.parentContactNo,
        )}</td>
      </tr>
      <tr class="sign">
        <td colspan="3"><b>Signature of the Parent/Guardian</b></td>
        <td colspan="2"><b>Applicant's Signature:</b></td>
      </tr>
    </table>
  </div>
</body>
</html>`;
};

// ================================================================
// SCREEN COMPONENTS
// ================================================================
const T = ({ style, children }) => (
  <Text allowFontScaling={false} style={[styles.cellText, style]}>
    {children}
  </Text>
);

// Table cell: w = width (design px), grow = baaki jagah
const Cell = ({ w, grow, h, style, textStyle, label, value, children }) => (
  <View
    style={[
      styles.cell,
      w !== undefined && { width: w },
      grow && styles.grow,
      h !== undefined && { minHeight: h },
      style,
    ]}
  >
    {children || (
      <T style={textStyle}>
        {label !== undefined && <T style={styles.bold}>{label} </T>}
        {text(value)}
      </T>
    )}
  </View>
);

const Row = ({ children, style }) => (
  <View style={[styles.row, style]}>{children}</View>
);

const Photo = ({ uri, style }) => (
  <View style={[styles.photoBox, style]}>
    {uri ? (
      <Image source={{ uri }} style={styles.photoImage} resizeMode="cover" />
    ) : (
      <T style={styles.photoText}>Photo</T>
    )}
  </View>
);

// A4 sheet ko screen ke hisaab se scale karta hai
const ScaledSheet = ({ scale, children }) => {
  const [height, setHeight] = useState(0);

  return (
    <View
      style={[
        styles.scaleWrap,
        { width: SHEET_WIDTH * scale, height: height * scale },
      ]}
    >
      <View
        onLayout={event => setHeight(event.nativeEvent.layout.height)}
        style={[
          styles.page,
          {
            left: (-SHEET_WIDTH * (1 - scale)) / 2,
            top: (-height * (1 - scale)) / 2,
            transform: [{ scale }],
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const ApplicationPage = ({ d, v }) => {
  const top = [styles.bold, styles.center];

  return (
    <View style={styles.sheet}>
      <View style={styles.band}>
        <Image
          source={{ uri: HEADER_IMAGE }}
          style={styles.headerImage}
          resizeMode="contain"
        />
      </View>

      <View style={[styles.band, styles.sessionBand]}>
        <T style={styles.sessionText}>
          Higher Education Scholarship Application Form is valid for session{' '}
          {v.session}
        </T>
        <T style={[styles.sessionText, styles.muted]}>
          (Submission of this application does not guarantee for approval of the
          Scholarship)
        </T>
      </View>

      <View style={[styles.band, styles.markBand]}>
        <T style={[styles.mark, styles.bold]}>FORM NO: {v.applicationNo}</T>
      </View>

      <View style={styles.band}>
        <T style={styles.warnText}>
          Application without proof of admission i.e. (Fee Receipt or Bonafide
          certificate & Last Examination passed mark sheet will be{' '}
          <T style={[styles.warnText, styles.bold]}>SUMMARILY REJECTED</T>)
        </T>
      </View>

      <View style={[styles.band, styles.markBand]}>
        <T style={styles.mark}>
          (Orphan [Yateem] Students are requested to submit death certificate of
          his/her Father)
        </T>
      </View>

      {/* JADEED/TAJDEED + OFFICIAL USE + PHOTO */}
      <View style={[styles.table, styles.row]}>
        <View style={styles.grow}>
          <Row>
            <View style={styles.row}>
              <View>
                <Row>
                  <Cell
                    w={292}
                    h={82}
                    style={[styles.grey, styles.middle]}
                    textStyle={top}
                    value="JADEED - New Application"
                  />
                  <Cell
                    w={40}
                    style={styles.middle}
                    textStyle={top}
                    value={v.isRenewal ? '' : '✔'}
                  />
                </Row>
                <Row>
                  <Cell
                    w={292}
                    style={styles.grey}
                    textStyle={top}
                    value="TAJDEED - Appln. For RENEWAL"
                  />
                  <Cell w={40} textStyle={top} value={v.isRenewal ? '✔' : ''} />
                </Row>
              </View>
              <Cell
                w={139}
                style={[styles.grey, styles.middle]}
                textStyle={top}
                value="✓Tick any one"
              />
            </View>
            <View style={styles.grow}>
              <Cell
                h={82}
                style={[styles.grey, styles.middle]}
                textStyle={top}
                value="Wazifa Number"
              />
              <Cell textStyle={top} value={v.wazifaNo} />
            </View>
          </Row>
          <Row style={styles.grey}>
            <Cell grow textStyle={styles.bold} value="For Official Use:" />
            <Cell w={159} textStyle={styles.bold} value={`Date: ${v.date}`} />
          </Row>
          <Row style={styles.grey}>
            <Cell
              grow
              textStyle={styles.bold}
              value={`Screening Committee Remarks: ${text(d.remarks)}`}
            />
          </Row>
          <Row style={styles.grey}>
            <Cell
              grow
              textStyle={styles.bold}
              value={`Member's Name of Screening Committee: ${text(
                d.screeningMember,
              )}`}
            />
            <Cell w={159} textStyle={styles.bold} value="Signature:" />
          </Row>
        </View>

        {/* PROFILE PHOTO (RIGHT SIDE) */}
        <Cell w={130} style={[styles.photoCell, styles.photoRight]}>
          <Photo uri={v.photo} style={styles.mainPhoto} />
        </Cell>
      </View>

      {/* STUDENT APPLICATION FORM */}
      <View style={styles.table}>
        <Cell
          style={styles.barCell}
          textStyle={top}
          value="STUDENT APPLICATION FORM"
        />
        {v.studentRows.map(([l1, v1, l2, v2]) => (
          <Row key={l1}>
            <Cell
              w={117}
              style={styles.grey}
              textStyle={styles.bold}
              value={l1}
            />
            {l2 ? (
              <>
                <Cell w={170} value={v1} />
                <Cell
                  w={187}
                  style={styles.grey}
                  textStyle={styles.bold}
                  value={l2}
                />
                <Cell grow value={v2} />
              </>
            ) : (
              <Cell grow value={v1} />
            )}
          </Row>
        ))}
      </View>

      {/* RECOMMENDATIONS */}
      {v.recommendations.map(section => (
        <View key={section.title} style={styles.table}>
          <Cell style={styles.barCell}>
            <T style={[styles.bold, styles.center]}>
              {section.title}{' '}
              <T style={styles.redText}>(Not to be filled by student)</T>
            </T>
          </Cell>
          {section.rows.map((row, index) => (
            <Row key={index} style={styles.grey}>
              {row.map(([label, value, width]) => (
                <Cell key={label} w={`${width}%`} label={label} value={value} />
              ))}
            </Row>
          ))}
        </View>
      ))}

      {/* DECLARATION */}
      <View style={styles.declaration}>
        {[
          DECLARATION_1,
          <>
            {DECLARATION_2[0]}
            <T style={[styles.declText, styles.bold]}>{DECLARATION_2[1]}</T>
            {DECLARATION_2[2]}
          </>,
        ].map((content, index) => (
          <View key={index} style={styles.declRow}>
            <View style={styles.checkbox}>
              <T style={styles.checkMark}>✓</T>
            </View>
            <T style={[styles.declText, styles.grow]}>{content}</T>
          </View>
        ))}

        <View style={styles.signRow}>
          <View style={styles.signBox}>
            <T style={styles.declText}>Signature of Parent/Guardian:</T>
          </View>
          <View style={styles.signBox}>
            <T style={styles.declText}>Signature of Student:</T>
          </View>
        </View>
      </View>
    </View>
  );
};

const IdentificationPage = ({ d, v }) => (
  <View style={styles.secondPage}>
    <View style={styles.noteBox}>
      <T style={styles.noteText}>
        NOTE: Students are advised to keep a photocopy of the filled-in
        application form for future record.
      </T>
      <T style={styles.noteText}>
        Please ensure that the following documents are enclosed:
      </T>
      {DOCUMENTS.map(item => (
        <View key={item} style={styles.bulletRow}>
          <View style={styles.bullet} />
          <T style={styles.bulletText}>{item}</T>
        </View>
      ))}
    </View>

    <T style={styles.slipTitle}>
      IDENTIFICATION SLIP <T style={styles.slipTitleSmall}>(FOR PAYMENT)</T>
    </T>
    <T style={styles.slipSubTitle}>
      (Please fill up all Information in Capital Letters)
    </T>

    <View style={styles.table}>
      <Row>
        <Cell
          w={522}
          textStyle={styles.bold}
          value={`Session - ${v.session}`}
        />
        <Cell
          grow
          label="Wazifa No (In case of [Tajdeed] Renewal):"
          value={v.isRenewal ? v.wazifaNo : ''}
        />
      </Row>

      <Row>
        <View style={styles.slipLeft}>
          <Row>
            <Cell
              grow
              h={34}
              style={styles.middle}
              label="Student's Name:"
              value={d.studentName}
            />
          </Row>
          <Row>
            <Cell
              w={522}
              h={34}
              style={styles.middle}
              label="Father Name:"
              value={d.fatherName}
            />
            <Cell grow style={styles.middle} label="DOB:" value={v.dob} />
          </Row>
          <Row>
            <Cell
              w={129}
              h={34}
              style={styles.middle}
              label="Class:"
              value={d.presentClass}
            />
            <Cell
              w={315}
              style={styles.middle}
              label="Name of Course:"
              value={v.course}
            />
            <Cell
              w={78}
              style={styles.middle}
              label="Year:"
              value={d.courseDuration}
            />
            <Cell grow style={styles.middle} label="Sem:" value={d.semester} />
          </Row>
          <Row>
            <Cell
              w={522}
              h={34}
              style={styles.middle}
              label="Address:"
              value={d.presentAddress || d.permanentAddress}
            />
            <Cell
              grow
              style={styles.middle}
              label="Pincode:"
              value={d.pinCode}
            />
          </Row>
        </View>
        <Cell w={130} style={styles.photoCell}>
          <Photo uri={v.photo} style={styles.slipPhoto} />
        </Cell>
      </Row>

      <Row>
        <Cell
          grow
          label="Name of the Institution/College:"
          value={d.institutionName}
        />
      </Row>
      <Row>
        <Cell w={444} label="Phone No. (Applicant):" value={d.contactNo} />
        <Cell
          grow
          label="Phone No. (Parent/Guardian):"
          value={d.parentContactNo}
        />
      </Row>
      <Row>
        <Cell
          w={522}
          h={70}
          style={styles.middle}
          textStyle={styles.bold}
          value="Signature of the Parent/Guardian"
        />
        <Cell
          grow
          style={styles.middle}
          textStyle={styles.bold}
          value="Applicant's Signature:"
        />
      </Row>
    </View>
  </View>
);

// ================================================================
// MAIN SCREEN
// ================================================================
const ScholarshipFormView = ({ navigation, route }) => {
  const initialData = route?.params?.data || null;
  const { width: screenWidth } = useWindowDimensions();

  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [error, setError] = useState('');

  const fetchScholarshipForm = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError('');

        const token = route?.params?.authToken;
        if (!token) {
          throw new Error('Session expired. Please login again.');
        }

        const response = await getMyScholarshipForm(token);
        if (response?.success && response?.data) {
          setFormData(response.data);
        } else {
          throw new Error(response?.message || 'Scholarship form not found.');
        }
      } catch (err) {
        console.log(
          'Scholarship Form Error:',
          err?.response?.data || err.message,
        );
        setError(
          err?.response?.data?.message ||
            err.message ||
            'Something went wrong.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [route?.params?.authToken],
  );

  useEffect(() => {
    if (!initialData) {
      fetchScholarshipForm();
    }
  }, [initialData, fetchScholarshipForm]);

  const handleDownloadPDF = async () => {
    if (!formData) return;

    try {
      setDownloadingPdf(true);
      await RNPrint.print({
        html: buildHtml(formData),
        jobName: `Scholarship_Form_${formData.applicationNo || 'AWSM'}`,
      });
    } catch (err) {
      console.log('PDF Download Error:', err);
      Alert.alert(
        'Download Error',
        'PDF generate nahi ho paya. Dobara try karein.',
      );
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Scholarship Form...</Text>
      </View>
    );
  }

  if (error && !formData) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle-outline" size={55} color={colors.danger} />
        <Text style={styles.errorTitle}>Unable to Load Form</Text>
        <Text style={styles.errorMessage}>{error}</Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchScholarshipForm()}
        >
          <Icon name="refresh" size={18} color={colors.white} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={styles.backLink}
        >
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const d = formData || {};
  const v = getFormValues(d);
  const scale = zoomed ? ZOOM_SCALE : (screenWidth - 16) / SHEET_WIDTH;

  return (
    <AppLayout>
      <View style={styles.container}>
        <BackHeader
          navigation={navigation}
          title="Scholarship Form"
          onBack={() => navigation.goBack()}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            route?.params?.authToken ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchScholarshipForm(true)}
                colors={[colors.primary]}
              />
            ) : undefined
          }
        >
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => setZoomed(value => !value)}
          >
            <Icon
              name={zoomed ? 'magnify-minus-outline' : 'magnify-plus-outline'}
              size={18}
              color={colors.primary}
            />
            <Text style={styles.zoomText}>
              {zoomed ? 'Fit to Screen' : 'Zoom'}
            </Text>
          </TouchableOpacity>

          <ScrollView horizontal nestedScrollEnabled>
            <View>
              <ScaledSheet scale={scale}>
                <ApplicationPage d={d} v={v} />
              </ScaledSheet>
              <View style={styles.pageGap} />
              <ScaledSheet scale={scale}>
                <IdentificationPage d={d} v={v} />
              </ScaledSheet>
            </View>
          </ScrollView>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.pdfDownloadBtn,
              downloadingPdf && styles.disabledBtn,
            ]}
            onPress={handleDownloadPDF}
            disabled={downloadingPdf}
          >
            {downloadingPdf ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Icon name="file-pdf-box" size={22} color={colors.white} />
            )}
            <Text style={styles.pdfDownloadText}>
              {downloadingPdf ? 'Generating PDF...' : 'Download Form as PDF'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </AppLayout>
  );
};

// ================================================================
// STYLES
// ================================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundDark },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  loadingText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    marginTop: 12,
  },
  errorTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: colors.TitleColor,
    marginTop: 15,
  },
  errorMessage: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
    gap: 8,
  },
  retryText: {
    color: colors.white,
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
  },
  backLink: { marginTop: 18 },
  backLinkText: { color: colors.primary, fontFamily: FontFamily.medium },

  scrollContent: { padding: 8, paddingBottom: 95 },
  zoomButton: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 6,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  zoomText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: colors.primary,
  },

  // A4 sheet (design px)
  scaleWrap: { overflow: 'hidden', backgroundColor: '#FFFFFF' },
  page: {
    position: 'absolute',
    width: SHEET_WIDTH,
    backgroundColor: '#FFFFFF',
  },
  pageGap: { height: 12 },
  sheet: { borderWidth: 1, borderColor: '#99A1AF' },
  band: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#99A1AF',
    paddingHorizontal: 4,
  },
  headerImage: { width: 289, height: 53 },
  sessionBand: { paddingTop: 3, paddingBottom: 5 },
  sessionText: { fontSize: 7.8, lineHeight: 17, textAlign: 'center' },
  muted: { color: '#6A7282' },
  markBand: { paddingVertical: 7 },
  mark: { fontSize: 7.8, backgroundColor: '#E5E7EB', paddingHorizontal: 2 },
  warnText: { fontSize: 11.5, lineHeight: 20, textAlign: 'center' },

  // tables
  table: { borderTopWidth: 1, borderLeftWidth: 1, borderColor: '#000000' },
  row: { flexDirection: 'row' },
  grow: { flex: 1 },
  cell: {
    minHeight: 13,
    paddingHorizontal: 3,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000000',
  },
  cellText: {
    fontFamily: FontFamily.regular,
    fontSize: 7.4,
    color: '#000000',
    includeFontPadding: false,
  },
  bold: { fontFamily: FontFamily.bold },
  center: { textAlign: 'center' },
  middle: { justifyContent: 'center' },
  grey: { backgroundColor: '#F0F0F0' },
  barCell: { backgroundColor: '#E0E0E0', alignItems: 'center' },
  redText: { fontFamily: FontFamily.bold, fontSize: 10, color: '#FF0000' },

  // photo
  photoCell: {
    padding: 2,
    justifyContent: 'flex-start',
    backgroundColor: '#FFFFFF',
  },
  photoRight: { alignItems: 'flex-end' },
  photoBox: {
    borderWidth: 1,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mainPhoto: { width: 110, height: 130 },
  slipPhoto: { width: '100%', height: 129 },
  photoImage: { width: '100%', height: '100%' },
  photoText: { fontSize: 11, color: '#888888' },

  // declaration
  declaration: { paddingTop: 4, paddingHorizontal: 4, paddingBottom: 4 },
  declRow: { flexDirection: 'row', marginBottom: 9 },
  checkbox: {
    width: 13,
    height: 13,
    marginTop: 4,
    marginRight: 7,
    borderRadius: 2,
    backgroundColor: '#0B6FD8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { fontSize: 10, color: '#FFFFFF' },
  declText: { fontSize: 11.5, lineHeight: 22 },
  signRow: { flexDirection: 'row', justifyContent: 'space-between' },
  signBox: {
    width: 180,
    height: 62,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },

  // page 2
  secondPage: { paddingVertical: 8 },
  noteBox: {
    backgroundColor: '#FEFCE8',
    borderLeftWidth: 4,
    borderLeftColor: '#FCC800',
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  noteText: { fontSize: 11.5, color: '#1E2939', marginBottom: 12 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', height: 24 },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 8,
    backgroundColor: '#1E2939',
  },
  bulletText: { fontSize: 11.5, color: '#1E2939' },
  slipTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },
  slipTitleSmall: { fontFamily: FontFamily.bold, fontSize: 10 },
  slipSubTitle: {
    fontSize: 11.5,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 11,
  },
  slipLeft: { width: 632 },

  // bottom button
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 10,
  },
  pdfDownloadBtn: {
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledBtn: { opacity: 0.7 },
  pdfDownloadText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    color: colors.white,
  },
});

export default ScholarshipFormView;
