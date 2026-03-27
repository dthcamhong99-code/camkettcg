import { Document, Packer, Paragraph, TextRun, AlignmentType, PageBreak, TabStopType, Table, TableRow, TableCell, BorderStyle, WidthType } from 'docx';
import { saveAs } from 'file-saver';

export const exportToWord = async (people: any[], packageName: string, decision: string, day: string, month: string, year: string) => {
  if (!people || people.length === 0) {
    throw new Error("Không có dữ liệu nhân sự để xuất.");
  }

  const children: any[] = [];

  people.forEach((person, index) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Số:          /TCG", size: 28, font: "Times New Roman" }),
          new TextRun({ text: "\t", size: 28, font: "Times New Roman" }),
          new TextRun({ 
            text: `An Hội Đông, ngày ${day || '......'} tháng ${month || '......'} năm ${year || '......'}`, 
            italics: true, 
            size: 28, 
            font: "Times New Roman" 
          }),
        ],
        tabStops: [
          {
            type: TabStopType.RIGHT,
            position: 9072, // 160mm in twips (210 - 30 - 20 = 160)
          },
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Phụ lục 06", bold: true, size: 28, font: "Times New Roman" }),
        ],
        alignment: AlignmentType.RIGHT,
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "(Theo TT 79/TT-BTC ngày 04/8/2025)", italics: true, size: 28, font: "Times New Roman" }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "BẢN CAM KẾT", bold: true, size: 32, font: "Times New Roman" }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Tôi tên là: ", size: 28, font: "Times New Roman" }),
          new TextRun({ text: person.name || '................................................', bold: true, size: 28, font: "Times New Roman" }),
        ],
        indent: { firstLine: 720 },
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Số Căn cước/CCCD/Hộ chiếu: ${person.cccd || '................................................'}`, size: 28, font: "Times New Roman" }),
        ],
        indent: { firstLine: 720 },
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ 
            text: `Là thành viên của tổ chuyên gia đánh giá E-HSDT/hồ sơ dự thầu gói thầu “${packageName || '................................................'}” theo ${decision || '................................................'} của Công ty Điện lực Gia Định. Tôi được cấp chứng chỉ nghiệp vụ chuyên môn về đấu thầu số: ${person.certificate || '................................................'}.`, 
            size: 28, 
            font: "Times New Roman" 
          }),
        ],
        indent: { firstLine: 720 },
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Tôi cam kết như sau:", size: 28, font: "Times New Roman" }),
        ],
        indent: { firstLine: 720 },
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "- Được đào tạo theo quy định của pháp luật hiện hành, có đầy đủ bằng cấp, chứng chỉ chuyên môn phù hợp và có năng lực, kinh nghiệm để đánh giá E-HSDT đối với gói thầu đang xét;", size: 28, font: "Times New Roman" }),
        ],
        indent: { firstLine: 720 },
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "- Đánh giá E-HSDT trên cơ sở trung thực, khách quan, công bằng, không chịu bất kỳ sự ràng buộc về lợi ích đối với các bên;", size: 28, font: "Times New Roman" }),
        ],
        indent: { firstLine: 720 },
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "- Chịu trách nhiệm trước pháp luật về kết quả đánh giá E-HSDT của mình;", size: 28, font: "Times New Roman" }),
        ],
        indent: { firstLine: 720 },
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "- Bảo mật các thông tin và hồ sơ, tài liệu trong quá trình đánh giá E-HSDT theo đúng quy định của pháp luật;", size: 28, font: "Times New Roman" }),
        ],
        indent: { firstLine: 720 },
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "- Không vi phạm các quy định về bảo đảm cạnh tranh.", size: 28, font: "Times New Roman" }),
        ],
        indent: { firstLine: 720 },
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Nếu tôi vi phạm nội dung cam kết nêu trên, tôi xin chịu trách nhiệm trước pháp luật./.", size: 28, font: "Times New Roman" }),
        ],
        indent: { firstLine: 720 },
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 400 },
      }),
      new Table({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.NONE },
          insideVertical: { style: BorderStyle.NONE },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [],
                width: { size: 40, type: WidthType.PERCENTAGE },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ 
                        text: `An Hội Đông, ngày ${day || '......'} tháng ${month || '......'} năm ${year || '......'}`, 
                        size: 28, 
                        font: "Times New Roman" 
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: "Người cam kết", bold: true, size: 28, font: "Times New Roman" }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: "(Ký và ghi rõ họ tên)", italics: true, size: 28, font: "Times New Roman" }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 1200 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: person.name || '................................................', bold: true, size: 28, font: "Times New Roman" }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
                width: { size: 60, type: WidthType.PERCENTAGE },
              }),
            ],
          }),
        ],
      })
    );

    if (index < people.length - 1) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134, // 2cm
              right: 1134, // 2cm
              bottom: 1134, // 2cm
              left: 1701, // 3cm
            },
          },
        },
        children: children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Ban_Cam_Ket_${new Date().getTime()}.docx`);
};
